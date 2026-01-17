import { createSignal, createMemo, createEffect, For, Show } from "solid-js"
import { useParams, useNavigate, useSearchParams } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { base64Decode } from "@opencode-ai/util/encode"
import { useWorkflow } from "@/context/workflow"

interface RoadmapItem {
  id: string
  title: string
  description: string
  phase: "foundation" | "mvp" | "scale"
  status: "planned" | "in-progress" | "completed"
  priority: "low" | "medium" | "high" | "critical"
  estimatedDays: number
  dependencies: string[]
  tasks: string[]
  assignedAgent?: string
}

interface Phase {
  id: string
  name: string
  description: string
  color: string
  items: RoadmapItem[]
}

export default function RoadmapPage() {
  const params = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [workflowStore, workflowActions] = useWorkflow()
  
  const directory = createMemo(() => params.dir ? base64Decode(params.dir) : "")
  
  const [activeTab, setActiveTab] = createSignal<"phases" | "timeline" | "dependencies">("phases")
  const [isGenerating, setIsGenerating] = createSignal(false)
  const [newItemTitle, setNewItemTitle] = createSignal("")
  const [selectedPhase, setSelectedPhase] = createSignal<string>("foundation")
  const [importedIdeas, setImportedIdeas] = createSignal(false)
  
  const [phases, setPhases] = createSignal<Phase[]>([
    {
      id: "foundation",
      name: "Foundation",
      description: "Core infrastructure and setup",
      color: "blue",
      items: [
        {
          id: "f1",
          title: "Project Setup & Architecture",
          description: "Initialize project structure, configure build tools, and set up development environment",
          phase: "foundation",
          status: "completed",
          priority: "critical",
          estimatedDays: 2,
          dependencies: [],
          tasks: [],
        },
        {
          id: "f2",
          title: "Database Schema Design",
          description: "Design and implement the database schema for core entities",
          phase: "foundation",
          status: "in-progress",
          priority: "high",
          estimatedDays: 3,
          dependencies: ["f1"],
          tasks: ["task-1", "task-2"],
          assignedAgent: "Claude 3.5",
        },
        {
          id: "f3",
          title: "Authentication System",
          description: "Implement user authentication with OAuth and JWT",
          phase: "foundation",
          status: "planned",
          priority: "high",
          estimatedDays: 4,
          dependencies: ["f2"],
          tasks: [],
        },
      ],
    },
    {
      id: "mvp",
      name: "MVP",
      description: "Minimum viable product features",
      color: "green",
      items: [
        {
          id: "m1",
          title: "Core API Endpoints",
          description: "Build REST API for all core CRUD operations",
          phase: "mvp",
          status: "planned",
          priority: "high",
          estimatedDays: 5,
          dependencies: ["f3"],
          tasks: [],
        },
        {
          id: "m2",
          title: "User Interface",
          description: "Build the main user interface components",
          phase: "mvp",
          status: "planned",
          priority: "high",
          estimatedDays: 7,
          dependencies: ["m1"],
          tasks: [],
        },
        {
          id: "m3",
          title: "Integration Testing",
          description: "Comprehensive testing of all MVP features",
          phase: "mvp",
          status: "planned",
          priority: "medium",
          estimatedDays: 3,
          dependencies: ["m2"],
          tasks: [],
        },
      ],
    },
    {
      id: "scale",
      name: "Scale",
      description: "Growth and optimization features",
      color: "purple",
      items: [
        {
          id: "s1",
          title: "Performance Optimization",
          description: "Optimize database queries, add caching, improve load times",
          phase: "scale",
          status: "planned",
          priority: "medium",
          estimatedDays: 5,
          dependencies: ["m3"],
          tasks: [],
        },
        {
          id: "s2",
          title: "Advanced Analytics",
          description: "Implement analytics dashboard and reporting",
          phase: "scale",
          status: "planned",
          priority: "low",
          estimatedDays: 6,
          dependencies: ["s1"],
          tasks: [],
        },
      ],
    },
  ])

  // Import ideas from workflow when coming from ideation page
  createEffect(() => {
    if (searchParams.fromIdeation && !importedIdeas() && workflowStore.acceptedIdeas.length > 0) {
      // Convert accepted ideas to roadmap items
      const newItems = workflowActions.convertIdeasToRoadmap()
      
      // Add the new items to the local phases
      setPhases(prev => {
        const updated = prev.map(phase => {
          const phaseItems = newItems.filter(item => item.phase === phase.id)
          if (phaseItems.length > 0) {
            const localItems: RoadmapItem[] = phaseItems.map(item => ({
              id: item.id,
              title: item.title,
              description: item.description,
              phase: item.phase,
              status: item.status,
              priority: item.priority,
              estimatedDays: item.estimatedDays,
              dependencies: item.dependencies,
              tasks: item.tasks,
              assignedAgent: item.assignedAgent,
            }))
            return { ...phase, items: [...phase.items, ...localItems] }
          }
          return phase
        })
        return updated
      })
      
      setImportedIdeas(true)
    }
  })

  const allItems = createMemo(() => phases().flatMap(p => p.items))
  
  const totalDays = createMemo(() => allItems().reduce((sum, item) => sum + item.estimatedDays, 0))
  const completedDays = createMemo(() => 
    allItems()
      .filter(item => item.status === "completed")
      .reduce((sum, item) => sum + item.estimatedDays, 0)
  )
  const progress = createMemo(() => totalDays() > 0 ? Math.round((completedDays() / totalDays()) * 100) : 0)

  const generateAIPlan = async () => {
    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Add AI-generated items
    setPhases(prev => prev.map(phase => {
      if (phase.id === "mvp") {
        return {
          ...phase,
          items: [...phase.items, {
            id: `ai-${Date.now()}`,
            title: "AI-Suggested: Real-time Notifications",
            description: "Implement WebSocket-based real-time notifications for better user engagement",
            phase: "mvp",
            status: "planned",
            priority: "medium",
            estimatedDays: 4,
            dependencies: ["m1"],
            tasks: [],
          }]
        }
      }
      return phase
    }))
    
    setIsGenerating(false)
  }

  const populateKanban = () => {
    const plannedItems = allItems().filter(item => item.status === "planned" || item.status === "in-progress")
    if (plannedItems.length === 0) {
      alert("No items to populate. Add roadmap items first.")
      return
    }
    
    // Add planned items to workflow store for kanban to consume
    for (const item of plannedItems) {
      workflowActions.addRoadmapItem({
        id: item.id,
        title: item.title,
        description: item.description,
        phase: item.phase,
        status: item.status,
        priority: item.priority,
        estimatedDays: item.estimatedDays,
        dependencies: item.dependencies,
        tasks: item.tasks,
        assignedAgent: item.assignedAgent,
      })
    }
    
    navigate(`/${params.dir}/kanban?fromRoadmap=true`)
  }

  const addItem = () => {
    if (!newItemTitle().trim()) return
    
    const newItem: RoadmapItem = {
      id: `item-${Date.now()}`,
      title: newItemTitle(),
      description: "New roadmap item",
      phase: selectedPhase() as "foundation" | "mvp" | "scale",
      status: "planned",
      priority: "medium",
      estimatedDays: 3,
      dependencies: [],
      tasks: [],
    }
    
    setPhases(prev => prev.map(phase => 
      phase.id === selectedPhase() 
        ? { ...phase, items: [...phase.items, newItem] }
        : phase
    ))
    
    setNewItemTitle("")
  }

  const updateItemStatus = (itemId: string, status: RoadmapItem["status"]) => {
    setPhases(prev => prev.map(phase => ({
      ...phase,
      items: phase.items.map(item => 
        item.id === itemId ? { ...item, status } : item
      )
    })))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500"
      case "in-progress": return "bg-blue-500"
      case "planned": return "bg-gray-400"
      default: return "bg-gray-400"
    }
  }

  const getPhaseColor = (color: string) => {
    switch (color) {
      case "blue": return "border-blue-500 bg-blue-50 dark:bg-blue-950"
      case "green": return "border-green-500 bg-green-50 dark:bg-green-950"
      case "purple": return "border-purple-500 bg-purple-50 dark:bg-purple-950"
      default: return "border-gray-500 bg-gray-50 dark:bg-gray-950"
    }
  }

  return (
    <div class="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div class="border-b border-border bg-card p-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold">Project Roadmap</h1>
            <p class="text-sm text-muted-foreground">{directory()}</p>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate(`/${params.dir}/workspace`)}>
              <Icon name="arrow-left" class="size-4 mr-2" />
              Back
            </Button>
            <Button variant="ghost" onClick={generateAIPlan} disabled={isGenerating()}>
              <Show when={isGenerating()} fallback={
                <>
                  <Icon name="brain" class="size-4 mr-2" />
                  AI Plan
                </>
              }>
                <Spinner class="size-4 mr-2" />
                Generating...
              </Show>
            </Button>
            <Button onClick={populateKanban}>
              <Icon name="task" class="size-4 mr-2" />
              Populate Kanban
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">Overall Progress</span>
            <span class="text-sm text-muted-foreground">{progress()}% complete • {completedDays()}/{totalDays()} days</span>
          </div>
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div class="h-full bg-primary rounded-full transition-all" style={{ width: `${progress()}%` }} />
          </div>
        </div>

        {/* Tabs */}
        <div class="flex gap-2">
          <Button 
            variant={activeTab() === "phases" ? "primary" : "ghost"} 
            size="small"
            onClick={() => setActiveTab("phases")}
          >
            Phases
          </Button>
          <Button 
            variant={activeTab() === "timeline" ? "primary" : "ghost"} 
            size="small"
            onClick={() => setActiveTab("timeline")}
          >
            Timeline
          </Button>
          <Button 
            variant={activeTab() === "dependencies" ? "primary" : "ghost"} 
            size="small"
            onClick={() => setActiveTab("dependencies")}
          >
            Dependencies
          </Button>
        </div>
      </div>

      {/* Add Item Bar */}
      <div class="border-b border-border bg-muted/30 p-4 flex items-center gap-4">
        <select 
          class="px-3 py-2 rounded-md border border-border bg-background text-sm"
          value={selectedPhase()}
          onChange={(e) => setSelectedPhase(e.currentTarget.value)}
        >
          <For each={phases()}>
            {(phase) => <option value={phase.id}>{phase.name}</option>}
          </For>
        </select>
        <input
          type="text"
          placeholder="Add new roadmap item..."
          value={newItemTitle()}
          onInput={(e) => setNewItemTitle(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          class="flex-1 px-4 py-2 rounded-md border border-border bg-background"
        />
        <Button onClick={addItem} disabled={!newItemTitle().trim()}>
          <Icon name="plus" class="size-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-auto p-6">
        <Show when={activeTab() === "phases"}>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <For each={phases()}>
              {(phase) => (
                <div class={`rounded-lg border-2 ${getPhaseColor(phase.color)} p-4`}>
                  <div class="flex items-center justify-between mb-4">
                    <div>
                      <h2 class="text-lg font-bold">{phase.name}</h2>
                      <p class="text-sm text-muted-foreground">{phase.description}</p>
                    </div>
                    <span class="text-sm font-medium">{phase.items.length} items</span>
                  </div>
                  
                  <div class="space-y-3">
                    <For each={phase.items}>
                      {(item) => (
                        <Card class="p-3 bg-background">
                          <div class="flex items-start justify-between mb-2">
                            <div class="flex items-center gap-2">
                              <div class={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
                              <h3 class="font-medium text-sm">{item.title}</h3>
                            </div>
                            <span class="text-xs text-muted-foreground">{item.estimatedDays}d</span>
                          </div>
                          <p class="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                          
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1">
                              <Show when={item.dependencies.length > 0}>
                                <span class="text-xs text-muted-foreground">
                                  <Icon name="branch" class="size-3 inline mr-1" />
                                  {item.dependencies.length}
                                </span>
                              </Show>
                              <Show when={item.assignedAgent}>
                                <span class="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                                  {item.assignedAgent}
                                </span>
                              </Show>
                            </div>
                            <select
                              class="text-xs px-2 py-1 rounded border border-border bg-background"
                              value={item.status}
                              onChange={(e) => updateItemStatus(item.id, e.currentTarget.value as RoadmapItem["status"])}
                            >
                              <option value="planned">Planned</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </Card>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={activeTab() === "timeline"}>
          <Card class="p-6">
            <h2 class="text-xl font-bold mb-4">Timeline View</h2>
            <div class="space-y-4">
              <For each={allItems()}>
                {(item, index) => (
                  <div class="flex items-center gap-4">
                    <div class="w-24 text-sm text-right text-muted-foreground">
                      Day {allItems().slice(0, index()).reduce((sum, i) => sum + i.estimatedDays, 0) + 1}
                    </div>
                    <div class={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium">{item.title}</span>
                        <span class="text-xs text-muted-foreground">({item.estimatedDays} days)</span>
                      </div>
                    </div>
                    <span class="text-xs px-2 py-1 rounded-full bg-muted">
                      {item.phase}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </Card>
        </Show>

        <Show when={activeTab() === "dependencies"}>
          <Card class="p-6">
            <h2 class="text-xl font-bold mb-4">Dependency Graph</h2>
            <div class="space-y-4">
              <For each={allItems().filter(item => item.dependencies.length > 0)}>
                {(item) => (
                  <div class="p-4 border border-border rounded-lg">
                    <div class="flex items-center gap-2 mb-2">
                      <Icon name="branch" class="size-4 text-muted-foreground" />
                      <span class="font-medium">{item.title}</span>
                    </div>
                    <div class="ml-6 flex items-center gap-2 flex-wrap">
                      <span class="text-sm text-muted-foreground">Depends on:</span>
                      <For each={item.dependencies}>
                        {(depId) => {
                          const dep = allItems().find(i => i.id === depId)
                          return (
                            <span class="text-xs px-2 py-1 rounded-full bg-muted">
                              {dep?.title || depId}
                            </span>
                          )
                        }}
                      </For>
                    </div>
                  </div>
                )}
              </For>
              <Show when={allItems().every(item => item.dependencies.length === 0)}>
                <p class="text-center text-muted-foreground py-8">No dependencies defined yet</p>
              </Show>
            </div>
          </Card>
        </Show>
      </div>
    </div>
  )
}
