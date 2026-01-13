import { createSignal, For, Show } from "solid-js"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Textarea } from "./ui/textarea"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { ScrollArea } from "./ui/scroll-area"
import { Lightbulb, Brain, TrendingUp, Target, Zap, ArrowRight, Plus, Filter, Search } from "lucide-solid"

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

export default function IdeationPanel() {
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
          tags: ["performance", "ui", "react"],
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

    // Simulate AI idea generation
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

  const getPriorityColor = (priority: Suggestion["priority"]) => {
    switch (priority) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: Suggestion["status"]) => {
    switch (status) {
      case "accepted":
        return "✅"
      case "considering":
        return "🤔"
      case "rejected":
        return "❌"
      default:
        return "💡"
    }
  }

  return (
    <div class="flex h-full bg-background">
      {/* Sidebar */}
      <div class="w-80 border-r border-border bg-muted/30 p-4">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <Brain class="size-5" />
            Ideation Sessions
          </h2>
          <Button size="sm" onClick={createNewSession}>
            <Plus class="size-4" />
          </Button>
        </div>

        <div class="space-y-2">
          <For each={sessions()}>
            {(session) => (
              <div
                class={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeSession() === session.id ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted"
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
      <div class="flex-1 flex flex-col">
        <div class="border-b border-border bg-card p-4">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-2xl font-bold">{currentSession()?.title}</h1>
            <div class="flex items-center gap-2">
              <Select value={filterType()} onChange={setFilterType}>
                <SelectTrigger class="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="feature">Features</SelectItem>
                  <SelectItem value="improvement">Improvements</SelectItem>
                  <SelectItem value="bug">Bug Fixes</SelectItem>
                  <SelectItem value="optimization">Optimizations</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSource()} onChange={setFilterSource}>
                <SelectTrigger class="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="ai">AI</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>

              <div class="relative">
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search ideas..."
                  value={searchQuery()}
                  onInput={(e) => setSearchQuery(e.currentTarget.value)}
                  class="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex-1">
              <div class="flex gap-2">
                <Input
                  placeholder="Ask AI for suggestions..."
                  value={newIdeaPrompt()}
                  onInput={(e) => setNewIdeaPrompt(e.currentTarget.value)}
                  class="flex-1"
                />
                <Button onClick={generateAIIdeas} disabled={!newIdeaPrompt().trim()}>
                  <Zap class="size-4 mr-2" />
                  Generate Ideas
                </Button>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea class="flex-1 p-6">
          <div class="grid gap-4 md:grid-cols-2">
            <For each={filteredSuggestions()}>
              {(suggestion) => (
                <Card class="p-4 hover:shadow-md transition-shadow">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span class="text-lg">{getStatusIcon(suggestion.status)}</span>
                      <Badge variant="outline" class="text-xs">
                        {suggestion.type}
                      </Badge>
                      <div class={`w-2 h-2 rounded-full ${getPriorityColor(suggestion.priority)}`} />
                    </div>
                    <Show when={suggestion.source === "ai" && suggestion.aiConfidence}>
                      <div class="flex items-center gap-1 text-xs text-muted-foreground">
                        <Brain class="size-3" />
                        {Math.round((suggestion.aiConfidence || 0) * 100)}%
                      </div>
                    </Show>
                  </div>

                  <h3 class="font-semibold mb-2">{suggestion.title}</h3>
                  <p class="text-sm text-muted-foreground mb-4 line-clamp-3">{suggestion.description}</p>

                  <div class="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" class="text-xs">
                      Impact: {suggestion.impact}
                    </Badge>
                    <Badge variant="secondary" class="text-xs">
                      Effort: {suggestion.effort}
                    </Badge>
                    <Badge variant="secondary" class="text-xs">
                      {suggestion.source}
                    </Badge>
                  </div>

                  <div class="flex items-center gap-2 mb-3 flex-wrap">
                    <For each={suggestion.tags}>
                      {(tag) => (
                        <Badge variant="outline" class="text-xs">
                          {tag}
                        </Badge>
                      )}
                    </For>
                  </div>

                  <div class="flex items-center gap-2">
                    <Show when={suggestion.status === "suggested"}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateSuggestionStatus(suggestion.id, "considering")}
                      >
                        Consider
                      </Button>
                    </Show>
                    <Show when={suggestion.status === "considering"}>
                      <Button size="sm" onClick={() => updateSuggestionStatus(suggestion.id, "accepted")}>
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateSuggestionStatus(suggestion.id, "rejected")}
                      >
                        Reject
                      </Button>
                    </Show>
                    <Show when={suggestion.relatedTasks && suggestion.relatedTasks.length > 0}>
                      <Button size="sm" variant="ghost">
                        <Target class="size-4 mr-2" />
                        {suggestion.relatedTasks.length} tasks
                      </Button>
                    </Show>
                  </div>
                </Card>
              )}
            </For>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
