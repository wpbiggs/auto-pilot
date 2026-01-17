import { createSignal, For, Show } from "solid-js"
import { useParams, useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { base64Decode } from "@opencode-ai/util/encode"

export interface AgentProfile {
  id: string
  name: string
  model: string
  provider: "openai" | "anthropic" | "google"
  capabilities: string[]
  costPer1kTokens: number
  speedRating: number // 1-10
  qualityRating: number // 1-10
  specialization: string[]
  description: string
  promptTemplate?: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  isCustom: boolean
  createdAt: Date
  usageCount?: number
}

const DEFAULT_AGENT_PROFILES: AgentProfile[] = [
  {
    id: "junior-dev",
    name: "Junior Developer",
    model: "gpt-4o-mini",
    provider: "openai",
    capabilities: ["coding", "debugging", "simple-refactoring"],
    costPer1kTokens: 0.15,
    speedRating: 9,
    qualityRating: 6,
    specialization: ["frontend", "basic-apis", "unit-tests"],
    description: "Fast and cost-effective for straightforward development tasks. Best for simple features, bug fixes, and repetitive work.",
    temperature: 0.7,
    maxTokens: 4000,
    isCustom: false,
    createdAt: new Date(),
    usageCount: 0
  },
  {
    id: "senior-dev",
    name: "Senior Developer",
    model: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    capabilities: ["coding", "debugging", "refactoring", "architecture", "testing", "documentation"],
    costPer1kTokens: 3.0,
    speedRating: 7,
    qualityRating: 10,
    specialization: ["full-stack", "complex-logic", "performance", "security"],
    description: "Top-tier development capabilities. Handles complex features, architectural decisions, and produces high-quality code with comprehensive testing.",
    temperature: 0.5,
    maxTokens: 8000,
    isCustom: false,
    createdAt: new Date(),
    usageCount: 0
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    model: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    capabilities: ["code-review", "security-audit", "best-practices", "testing"],
    costPer1kTokens: 3.0,
    speedRating: 8,
    qualityRating: 10,
    specialization: ["security", "performance", "maintainability", "testing"],
    description: "Specialized in thorough code reviews. Identifies security issues, performance bottlenecks, and suggests improvements following best practices.",
    systemPrompt: "You are an expert code reviewer. Focus on security, performance, maintainability, and adherence to best practices. Provide constructive feedback with specific examples and suggestions.",
    temperature: 0.3,
    maxTokens: 6000,
    isCustom: false,
    createdAt: new Date(),
    usageCount: 0
  },
  {
    id: "docs-writer",
    name: "Documentation Writer",
    model: "gpt-4o",
    provider: "openai",
    capabilities: ["documentation", "technical-writing", "tutorials"],
    costPer1kTokens: 2.5,
    speedRating: 8,
    qualityRating: 9,
    specialization: ["api-docs", "user-guides", "code-comments", "readme"],
    description: "Creates clear, comprehensive documentation. Excels at API docs, user guides, tutorials, and inline code comments.",
    systemPrompt: "You are a technical writer specializing in developer documentation. Write clear, concise, and comprehensive documentation with examples. Use proper formatting and structure.",
    temperature: 0.7,
    maxTokens: 4000,
    isCustom: false,
    createdAt: new Date(),
    usageCount: 0
  },
  {
    id: "security-analyst",
    name: "Security Analyst",
    model: "gpt-4o",
    provider: "openai",
    capabilities: ["security-audit", "vulnerability-detection", "threat-modeling"],
    costPer1kTokens: 2.5,
    speedRating: 7,
    qualityRating: 9,
    specialization: ["owasp", "authentication", "encryption", "input-validation"],
    description: "Security-focused analysis and recommendations. Identifies vulnerabilities, suggests mitigations, and ensures secure coding practices.",
    systemPrompt: "You are a security expert. Analyze code for vulnerabilities including SQL injection, XSS, CSRF, authentication issues, and more. Reference OWASP Top 10 and provide specific remediation steps.",
    temperature: 0.2,
    maxTokens: 6000,
    isCustom: false,
    createdAt: new Date(),
    usageCount: 0
  },
  {
    id: "perf-optimizer",
    name: "Performance Optimizer",
    model: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    capabilities: ["performance-optimization", "profiling", "caching", "database-optimization"],
    costPer1kTokens: 3.0,
    speedRating: 6,
    qualityRating: 9,
    specialization: ["algorithms", "database", "caching", "async-operations"],
    description: "Specialized in performance optimization. Analyzes bottlenecks, suggests algorithmic improvements, and implements caching strategies.",
    systemPrompt: "You are a performance optimization expert. Analyze code for performance bottlenecks, suggest algorithmic improvements, and implement efficient solutions. Focus on time and space complexity.",
    temperature: 0.4,
    maxTokens: 6000,
    isCustom: false,
    createdAt: new Date(),
    usageCount: 0
  }
]

export default function AgentMarketplacePage() {
  const params = useParams()
  const navigate = useNavigate()
  
  const directory = () => params.dir ? base64Decode(params.dir) : ""
  
  const [profiles, setProfiles] = createSignal<AgentProfile[]>(DEFAULT_AGENT_PROFILES)
  const [selectedProfile, setSelectedProfile] = createSignal<AgentProfile | null>(null)
  const [isCreating, setIsCreating] = createSignal(false)
  const [filterCapability, setFilterCapability] = createSignal<string>("all")
  const [sortBy, setSortBy] = createSignal<"name" | "cost" | "speed" | "quality" | "usage">("name")
  
  const allCapabilities = () => {
    const caps = new Set<string>()
    profiles().forEach(p => p.capabilities.forEach(c => caps.add(c)))
    return Array.from(caps).sort()
  }
  
  const filteredProfiles = () => {
    let filtered = profiles()
    
    if (filterCapability() !== "all") {
      filtered = filtered.filter(p => p.capabilities.includes(filterCapability()))
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy()) {
        case "cost": return a.costPer1kTokens - b.costPer1kTokens
        case "speed": return b.speedRating - a.speedRating
        case "quality": return b.qualityRating - a.qualityRating
        case "usage": return (b.usageCount || 0) - (a.usageCount || 0)
        default: return a.name.localeCompare(b.name)
      }
    })
  }
  
  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case "openai": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      case "anthropic": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
      case "google": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
    }
  }
  
  const getRatingColor = (rating: number) => {
    if (rating >= 9) return "text-green-500"
    if (rating >= 7) return "text-blue-500"
    if (rating >= 5) return "text-yellow-500"
    return "text-red-500"
  }
  
  return (
    <div class="flex-1 overflow-auto bg-background">
      <div class="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold">Agent Marketplace</h1>
            <p class="text-muted-foreground mt-1">
              Browse and configure AI agent profiles for your workflow
            </p>
          </div>
          <div class="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(`/${params.dir}/workspace`)}>
              <Icon name="arrow-left" class="mr-2 size-4" />
              Back
            </Button>
            <Button onClick={() => setIsCreating(true)}>
              <Icon name="plus" class="mr-2 size-4" />
              Create Custom Agent
            </Button>
          </div>
        </div>

        {/* Filters & Sort */}
        <Card class="p-4">
          <div class="flex items-center gap-4 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">Filter by capability:</span>
              <select
                class="px-3 py-1.5 rounded-md border border-border bg-background text-sm"
                value={filterCapability()}
                onChange={(e) => setFilterCapability(e.currentTarget.value)}
              >
                <option value="all">All Capabilities</option>
                <For each={allCapabilities()}>
                  {(cap) => <option value={cap}>{cap.replace(/-/g, " ")}</option>}
                </For>
              </select>
            </div>
            
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">Sort by:</span>
              <select
                class="px-3 py-1.5 rounded-md border border-border bg-background text-sm"
                value={sortBy()}
                onChange={(e) => setSortBy(e.currentTarget.value as any)}
              >
                <option value="name">Name</option>
                <option value="cost">Cost (Low to High)</option>
                <option value="speed">Speed (High to Low)</option>
                <option value="quality">Quality (High to Low)</option>
                <option value="usage">Most Used</option>
              </select>
            </div>
            
            <div class="ml-auto text-sm text-muted-foreground">
              {filteredProfiles().length} agent{filteredProfiles().length !== 1 ? "s" : ""}
            </div>
          </div>
        </Card>

        {/* Agent Grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <For each={filteredProfiles()}>
            {(profile) => (
              <Card 
                class="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProfile(profile)}
              >
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="size-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon name="mcp" class="size-6 text-primary" />
                    </div>
                    <div>
                      <h3 class="font-semibold">{profile.name}</h3>
                      <p class="text-xs text-muted-foreground">{profile.model}</p>
                    </div>
                  </div>
                  <Show when={profile.isCustom}>
                    <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                      Custom
                    </span>
                  </Show>
                </div>

                <p class="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {profile.description}
                </p>

                <div class="space-y-3">
                  {/* Provider */}
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-muted-foreground">Provider</span>
                    <span class={`text-xs px-2 py-0.5 rounded-full ${getProviderBadgeColor(profile.provider)}`}>
                      {profile.provider}
                    </span>
                  </div>

                  {/* Ratings */}
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-center">
                      <p class="text-xs text-muted-foreground mb-1">Speed</p>
                      <p class={`text-lg font-bold ${getRatingColor(profile.speedRating)}`}>
                        {profile.speedRating}/10
                      </p>
                    </div>
                    <div class="text-center">
                      <p class="text-xs text-muted-foreground mb-1">Quality</p>
                      <p class={`text-lg font-bold ${getRatingColor(profile.qualityRating)}`}>
                        {profile.qualityRating}/10
                      </p>
                    </div>
                    <div class="text-center">
                      <p class="text-xs text-muted-foreground mb-1">Cost</p>
                      <p class="text-lg font-bold text-blue-500">
                        ${profile.costPer1kTokens}
                      </p>
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div>
                    <p class="text-xs text-muted-foreground mb-2">Capabilities</p>
                    <div class="flex flex-wrap gap-1">
                      <For each={profile.capabilities.slice(0, 3)}>
                        {(cap) => (
                          <span class="text-xs px-2 py-0.5 bg-muted rounded-full">
                            {cap.replace(/-/g, " ")}
                          </span>
                        )}
                      </For>
                      <Show when={profile.capabilities.length > 3}>
                        <span class="text-xs text-muted-foreground">
                          +{profile.capabilities.length - 3} more
                        </span>
                      </Show>
                    </div>
                  </div>

                  {/* Usage */}
                  <Show when={profile.usageCount && profile.usageCount > 0}>
                    <div class="text-xs text-muted-foreground">
                      Used {profile.usageCount} times
                    </div>
                  </Show>
                </div>
              </Card>
            )}
          </For>
        </div>

        {/* Agent Detail Modal */}
        <Show when={selectedProfile()}>
          {(profile) => (
            <div 
              class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedProfile(null)}
            >
              <Card 
                class="max-w-2xl w-full max-h-[90vh] overflow-auto p-6"
                onClick={(e: MouseEvent) => e.stopPropagation()}
              >
                <div class="flex items-start justify-between mb-6">
                  <div>
                    <h2 class="text-2xl font-bold">{profile().name}</h2>
                    <p class="text-sm text-muted-foreground mt-1">{profile().model}</p>
                  </div>
                  <button
                    onClick={() => setSelectedProfile(null)}
                    class="p-2 hover:bg-muted rounded-lg"
                  >
                    <Icon name="close" class="size-5" />
                  </button>
                </div>

                <div class="space-y-6">
                  <div>
                    <h3 class="font-semibold mb-2">Description</h3>
                    <p class="text-sm text-muted-foreground">{profile().description}</p>
                  </div>

                  <div>
                    <h3 class="font-semibold mb-2">Specializations</h3>
                    <div class="flex flex-wrap gap-2">
                      <For each={profile().specialization}>
                        {(spec) => (
                          <span class="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full">
                            {spec.replace(/-/g, " ")}
                          </span>
                        )}
                      </For>
                    </div>
                  </div>

                  <div>
                    <h3 class="font-semibold mb-2">All Capabilities</h3>
                    <div class="flex flex-wrap gap-2">
                      <For each={profile().capabilities}>
                        {(cap) => (
                          <span class="text-sm px-3 py-1 bg-muted rounded-full">
                            {cap.replace(/-/g, " ")}
                          </span>
                        )}
                      </For>
                    </div>
                  </div>

                  <Show when={profile().systemPrompt}>
                    <div>
                      <h3 class="font-semibold mb-2">System Prompt</h3>
                      <div class="p-3 bg-muted/50 rounded-lg text-sm font-mono whitespace-pre-wrap">
                        {profile().systemPrompt}
                      </div>
                    </div>
                  </Show>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <h4 class="text-sm font-medium mb-1">Temperature</h4>
                      <p class="text-2xl font-bold">{profile().temperature ?? 0.7}</p>
                    </div>
                    <div>
                      <h4 class="text-sm font-medium mb-1">Max Tokens</h4>
                      <p class="text-2xl font-bold">{profile().maxTokens ?? 4000}</p>
                    </div>
                  </div>

                  <div class="flex gap-3">
                    <Button class="flex-1">
                      Use This Agent
                    </Button>
                    <Show when={profile().isCustom}>
                      <Button variant="ghost">
                        Edit
                      </Button>
                      <Button variant="ghost" class="text-red-500">
                        Delete
                      </Button>
                    </Show>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Show>
      </div>
    </div>
  )
}
