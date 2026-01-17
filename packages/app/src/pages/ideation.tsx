import { createSignal, createMemo, For, Show, onMount } from "solid-js"
import { useParams, useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { TextField } from "@opencode-ai/ui/text-field"
import { useGlobalSync } from "@/context/global-sync"
import { base64Decode } from "@opencode-ai/util/encode"

interface Suggestion {
  id: string
  type: "feature" | "improvement" | "bug" | "optimization"
  title: string
  description: string
  priority: "low" | "medium" | "high" | "critical"
  impact: "low" | "medium" | "high"
  effort: "low" | "medium" | "high"
  source: "ai" | "user" | "team"
  status: "suggested" | "considering" | "accepted" | "rejected"
  tags: string[]
  createdAt: Date
  aiConfidence?: number
  relatedTasks?: string[]
}

interface IdeationSession {
  id: string
  title: string
  context: string
  suggestions: Suggestion[]
  createdAt: Date
  lastActive: Date
}

export default function IdeationPage() {
  const params = useParams()
  const navigate = useNavigate()
  const globalSync = useGlobalSync()
  
  const directory = createMemo(() => params.dir ? base64Decode(params.dir) : "")
  
  const [sessions, setSessions] = createSignal<IdeationSession[]>([
    {
      id: "1",
      title: "Performance Optimization Ideas",
      context: "Looking for ways to improve application performance and user experience",
      suggestions: [
        {
          id: "1-1",
          type: "optimization",
          title: "Implement Virtual Scrolling",
          description: "Add virtual scrolling to large lists to improve rendering performance",
          priority: "high",
          impact: "high",
          effort: "medium",
          source: "ai",
          status: "considering",
          tags: ["performance", "ui"],
          createdAt: new Date(),
          aiConfidence: 0.85,
          relatedTasks: ["task-123", "task-124"],
        },
        {
          id: "1-2",
          type: "feature",
          title: "Add Service Worker Caching",
          description: "Implement service worker for offline support and faster page loads",
          priority: "medium",
          impact: "medium",
          effort: "high",
          source: "ai",
          status: "suggested",
          tags: ["pwa", "caching", "offline"],
          createdAt: new Date(),
          aiConfidence: 0.72,
        },
      ],
      createdAt: new Date(Date.now() - 86400000),
      lastActive: new Date(),
    },
  ])

  const [activeSession, setActiveSession] = createSignal<string>("1")
  const [newIdeaPrompt, setNewIdeaPrompt] = createSignal("")
  const [filterType, setFilterType] = createSignal<string>("all")
  const [filterSource, setFilterSource] = createSignal<string>("all")
  const [searchQuery, setSearchQuery] = createSignal("")
  const [isGenerating, setIsGenerating] = createSignal(false)

  const currentSession = () => sessions().find((s) => s.id === activeSession())

  const filteredSuggestions = () => {
    const session = currentSession()
    if (!session) return []

    return session.suggestions.filter((suggestion) => {
      const matchesType = filterType() === "all" || suggestion.type === filterType()
      const matchesSource = filterSource() === "all" || suggestion.source === filterSource()
      const matchesSearch =
        searchQuery() === "" ||
        suggestion.title.toLowerCase().includes(searchQuery().toLowerCase()) ||
        suggestion.description.toLowerCase().includes(searchQuery().toLowerCase())

      return matchesType && matchesSource && matchesSearch
    })
  }

  const generateAIIdeas = async () => {
    const session = currentSession()
    if (!session || !newIdeaPrompt().trim()) return

    setIsGenerating(true)
    
    // Simulate AI idea generation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const newSuggestions: Suggestion[] = [
      {
        id: `${session.id}-${Date.now()}-1`,
        type: "improvement",
        title: "Enhance Error Boundaries",
        description: "Improve error handling with better error boundaries and user feedback",
        priority: "medium",
        impact: "medium",
        effort: "low",
        source: "ai",
        status: "suggested",
        tags: ["error-handling", "ux"],
        createdAt: new Date(),
        aiConfidence: 0.78,
      },
      {
        id: `${session.id}-${Date.now()}-2`,
        type: "feature",
        title: "Add Dark Mode Support",
        description: "Implement dark mode theme for better accessibility and user preference",
        priority: "low",
        impact: "medium",
        effort: "medium",
        source: "ai",
        status: "suggested",
        tags: ["theme", "accessibility", "ui"],
        createdAt: new Date(),
        aiConfidence: 0.91,
      },
    ]

    setSessions((prev) =>
      prev.map((s) =>
        s.id === session.id ? { ...s, suggestions: [...s.suggestions, ...newSuggestions], lastActive: new Date() } : s,
      ),
    )

    setNewIdeaPrompt("")
    setIsGenerating(false)
  }

  const updateSuggestionStatus = (suggestionId: string, status: Suggestion["status"]) => {
    const session = currentSession()
    if (!session) return

    setSessions((prev) =>
      prev.map((s) =>
        s.id === session.id
          ? {
              ...s,
              suggestions: s.suggestions.map((sug) => (sug.id === suggestionId ? { ...sug, status } : sug)),
              lastActive: new Date(),
            }
          : s,
      ),
    )
  }

  const createNewSession = () => {
    const newSession: IdeationSession = {
      id: Date.now().toString(),
      title: `Ideation Session ${sessions().length + 1}`,
      context: "New ideation session",
      suggestions: [],
      createdAt: new Date(),
      lastActive: new Date(),
    }

    setSessions((prev) => [newSession, ...prev])
    setActiveSession(newSession.id)
  }

  const convertToRoadmap = () => {
    const session = currentSession()
    if (!session) return
    
    const acceptedIdeas = session.suggestions.filter(s => s.status === "accepted")
    if (acceptedIdeas.length === 0) {
      alert("Please accept some ideas first before converting to roadmap")
      return
    }
    
    // Navigate to roadmap with the accepted ideas
    navigate(`/${params.dir}/roadmap?fromIdeation=${session.id}`)
  }

  const getPriorityColor = (priority: Suggestion["priority"]) => {
    switch (priority) {
      case "critical": return "bg-red-500"
      case "high": return "bg-orange-500"
      case "medium": return "bg-yellow-500"
      case "low": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: Suggestion["status"]) => {
    switch (status) {
      case "accepted": return "✅"
      case "considering": return "🤔"
      case "rejected": return "❌"
      default: return "💡"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feature": return "sparkles"
      case "improvement": return "trending-up"
      case "bug": return "bug"
      case "optimization": return "zap"
      default: return "lightbulb"
    }
  }

  return (
    <div class="flex h-full bg-background">
      {/* Sidebar */}
      <div class="w-80 border-r border-border bg-muted/30 p-4 flex flex-col">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <Icon name="brain" class="size-5" />
            Ideation
          </h2>
          <Button size="small" onClick={createNewSession}>
            <Icon name="plus" class="size-4" />
          </Button>
        </div>

        <div class="flex-1 overflow-auto space-y-2">
          <For each={sessions()}>
            {(session) => (
              <div
                class={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeSession() === session.id 
                    ? "bg-primary/10 border-primary" 
                    : "bg-card hover:bg-muted border-border"
                }`}
                onClick={() => setActiveSession(session.id)}
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="font-medium text-sm">{session.title}</h3>
                    <p class="text-xs text-muted-foreground mt-1 line-clamp-2">{session.context}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{session.suggestions.length} ideas</span>
                  <span>{session.lastActive.toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Main Content */}
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="border-b border-border bg-card p-4">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-2xl font-bold">{currentSession()?.title}</h1>
              <p class="text-sm text-muted-foreground">{currentSession()?.context}</p>
            </div>
            <div class="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate(`/${params.dir}/workspace`)}>
                <Icon name="arrow-left" class="size-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={convertToRoadmap}
                disabled={!currentSession()?.suggestions.some(s => s.status === "accepted")}
              >
                <Icon name="checklist" class="size-4 mr-2" />
                Convert to Roadmap
              </Button>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex gap-2">
              <select 
                class="px-3 py-2 rounded-md border border-border bg-background text-sm"
                value={filterType()}
                onChange={(e) => setFilterType(e.currentTarget.value)}
              >
                <option value="all">All Types</option>
                <option value="feature">Features</option>
                <option value="improvement">Improvements</option>
                <option value="bug">Bug Fixes</option>
                <option value="optimization">Optimizations</option>
              </select>

              <select 
                class="px-3 py-2 rounded-md border border-border bg-background text-sm"
                value={filterSource()}
                onChange={(e) => setFilterSource(e.currentTarget.value)}
              >
                <option value="all">All Sources</option>
                <option value="ai">AI</option>
                <option value="user">User</option>
                <option value="team">Team</option>
              </select>

              <div class="relative">
                <Icon name="magnifying-glass" class="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search ideas..."
                  value={searchQuery()}
                  onInput={(e) => setSearchQuery(e.currentTarget.value)}
                  class="pl-10 pr-4 py-2 rounded-md border border-border bg-background text-sm w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Idea Generator */}
        <div class="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div class="flex gap-2">
            <input
              type="text"
              placeholder="Share your idea... 'Build a task management app with AI features'"
              value={newIdeaPrompt()}
              onInput={(e) => setNewIdeaPrompt(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && generateAIIdeas()}
              class="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-base"
            />
            <Button 
              onClick={generateAIIdeas} 
              disabled={!newIdeaPrompt().trim() || isGenerating()}
              class="px-6"
            >
              <Show when={isGenerating()} fallback={
                <>
                  <Icon name="brain" class="size-4 mr-2" />
                  Generate Ideas
                </>
              }>
                <Spinner class="size-4 mr-2" />
                Generating...
              </Show>
            </Button>
          </div>
        </div>

        <div class="flex-1 overflow-auto p-6">
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <For each={filteredSuggestions()}>
              {(suggestion) => (
                <Card class="p-4 hover:shadow-lg transition-shadow">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span class="text-lg">{getStatusIcon(suggestion.status)}</span>
                      <span class="text-xs px-2 py-1 rounded-full bg-muted">
                        {suggestion.type}
                      </span>
                      <div class={`w-2 h-2 rounded-full ${getPriorityColor(suggestion.priority)}`} />
                    </div>
                    <Show when={suggestion.source === "ai" && suggestion.aiConfidence}>
                      <div class="flex items-center gap-1 text-xs text-muted-foreground">
                        <Icon name="brain" class="size-3" />
                        {Math.round((suggestion.aiConfidence || 0) * 100)}%
                      </div>
                    </Show>
                  </div>

                  <h3 class="font-semibold mb-2">{suggestion.title}</h3>
                  <p class="text-sm text-muted-foreground mb-4 line-clamp-3">{suggestion.description}</p>

                  <div class="flex items-center gap-2 mb-3 flex-wrap">
                    <span class="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      Impact: {suggestion.impact}
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      Effort: {suggestion.effort}
                    </span>
                  </div>

                  <div class="flex items-center gap-1 mb-3 flex-wrap">
                    <For each={suggestion.tags.slice(0, 3)}>
                      {(tag) => (
                        <span class="text-xs px-2 py-0.5 rounded-full border border-border">
                          {tag}
                        </span>
                      )}
                    </For>
                    <Show when={suggestion.tags.length > 3}>
                      <span class="text-xs text-muted-foreground">+{suggestion.tags.length - 3}</span>
                    </Show>
                  </div>

                  <div class="flex items-center gap-2 pt-3 border-t border-border">
                    <Show when={suggestion.status === "suggested"}>
                      <Button
                        size="small"
                        variant="ghost"
                        onClick={() => updateSuggestionStatus(suggestion.id, "considering")}
                      >
                        Consider
                      </Button>
                    </Show>
                    <Show when={suggestion.status === "considering"}>
                      <Button size="small" onClick={() => updateSuggestionStatus(suggestion.id, "accepted")}>
                        Accept
                      </Button>
                      <Button
                        size="small"
                        variant="ghost"
                        onClick={() => updateSuggestionStatus(suggestion.id, "rejected")}
                      >
                        Reject
                      </Button>
                    </Show>
                    <Show when={suggestion.status === "accepted"}>
                      <span class="text-xs text-green-600 font-medium">Ready for Roadmap</span>
                    </Show>
                    <Show when={suggestion.relatedTasks && suggestion.relatedTasks.length > 0}>
                      <Button size="small" variant="ghost" class="ml-auto">
                        <Icon name="branch" class="size-4 mr-1" />
                        {suggestion.relatedTasks!.length}
                      </Button>
                    </Show>
                  </div>
                </Card>
              )}
            </For>
          </div>

          <Show when={filteredSuggestions().length === 0}>
            <div class="text-center py-12">
              <Icon name="brain" class="size-16 text-muted-foreground mx-auto mb-4" />
              <h3 class="text-xl font-semibold mb-2">No ideas yet</h3>
              <p class="text-muted-foreground mb-4">
                Share your idea above and let AI help you brainstorm
              </p>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
