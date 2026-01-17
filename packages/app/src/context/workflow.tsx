import { createContext, useContext, ParentComponent } from "solid-js"
import { createStore, produce } from "solid-js/store"

// Shared types for workflow pages
export interface WorkflowIdea {
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
  createdAt: number
  aiConfidence?: number
}

export interface WorkflowRoadmapItem {
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
  sourceIdeaId?: string
}

export interface WorkflowTask {
  id: string
  title: string
  description: string
  status: "backlog" | "in-progress" | "model-review" | "human-review" | "done"
  priority: "low" | "medium" | "high" | "critical"
  assignedAgent?: string
  progress: number
  estimatedTime?: string
  dependencies?: string[]
  createdAt: number
  tags: string[]
  sourceRoadmapId?: string
}

interface WorkflowStore {
  acceptedIdeas: WorkflowIdea[]
  roadmapItems: WorkflowRoadmapItem[]
  kanbanTasks: WorkflowTask[]
}

type WorkflowContextValue = [
  store: WorkflowStore,
  actions: {
    // Ideation → Roadmap
    addAcceptedIdea: (idea: WorkflowIdea) => void
    removeAcceptedIdea: (ideaId: string) => void
    clearAcceptedIdeas: () => void
    convertIdeasToRoadmap: () => WorkflowRoadmapItem[]
    
    // Roadmap → Kanban
    addRoadmapItem: (item: WorkflowRoadmapItem) => void
    updateRoadmapItem: (itemId: string, updates: Partial<WorkflowRoadmapItem>) => void
    removeRoadmapItem: (itemId: string) => void
    populateKanbanFromRoadmap: () => WorkflowTask[]
    
    // Kanban operations
    addTask: (task: WorkflowTask) => void
    updateTask: (taskId: string, updates: Partial<WorkflowTask>) => void
    removeTask: (taskId: string) => void
    
    // Utility
    reset: () => void
  }
]

const WorkflowContext = createContext<WorkflowContextValue>()

export const WorkflowProvider: ParentComponent = (props) => {
  const [store, setStore] = createStore<WorkflowStore>({
    acceptedIdeas: [],
    roadmapItems: [],
    kanbanTasks: [],
  })

  const actions: WorkflowContextValue[1] = {
    // Ideation → Roadmap
    addAcceptedIdea: (idea) => {
      setStore(produce(s => {
        if (!s.acceptedIdeas.find(i => i.id === idea.id)) {
          s.acceptedIdeas.push(idea)
        }
      }))
    },
    
    removeAcceptedIdea: (ideaId) => {
      setStore(produce(s => {
        s.acceptedIdeas = s.acceptedIdeas.filter(i => i.id !== ideaId)
      }))
    },
    
    clearAcceptedIdeas: () => {
      setStore(produce(s => {
        s.acceptedIdeas = []
      }))
    },
    
    convertIdeasToRoadmap: () => {
      const newItems: WorkflowRoadmapItem[] = store.acceptedIdeas.map((idea, index) => {
        // Determine phase based on priority and type
        let phase: "foundation" | "mvp" | "scale" = "mvp"
        if (idea.priority === "critical" || idea.type === "bug") {
          phase = "foundation"
        } else if (idea.priority === "low") {
          phase = "scale"
        }
        
        // Estimate days based on effort
        const effortDays = { low: 2, medium: 4, high: 7 }
        
        const item: WorkflowRoadmapItem = {
          id: `roadmap-${idea.id}`,
          title: idea.title,
          description: idea.description,
          phase,
          status: "planned",
          priority: idea.priority,
          estimatedDays: effortDays[idea.effort],
          dependencies: index > 0 ? [`roadmap-${store.acceptedIdeas[index - 1].id}`] : [],
          tasks: [],
          sourceIdeaId: idea.id,
        }
        
        return item
      })
      
      setStore(produce(s => {
        for (const item of newItems) {
          if (!s.roadmapItems.find(r => r.id === item.id)) {
            s.roadmapItems.push(item)
          }
        }
        s.acceptedIdeas = []
      }))
      
      return newItems
    },
    
    // Roadmap → Kanban
    addRoadmapItem: (item) => {
      setStore(produce(s => {
        if (!s.roadmapItems.find(r => r.id === item.id)) {
          s.roadmapItems.push(item)
        }
      }))
    },
    
    updateRoadmapItem: (itemId, updates) => {
      setStore(produce(s => {
        const item = s.roadmapItems.find(r => r.id === itemId)
        if (item) {
          Object.assign(item, updates)
        }
      }))
    },
    
    removeRoadmapItem: (itemId) => {
      setStore(produce(s => {
        s.roadmapItems = s.roadmapItems.filter(r => r.id !== itemId)
      }))
    },
    
    populateKanbanFromRoadmap: () => {
      const plannedItems = store.roadmapItems.filter(
        item => item.status === "planned" || item.status === "in-progress"
      )
      
      const newTasks: WorkflowTask[] = plannedItems.map(item => {
        const task: WorkflowTask = {
          id: `task-${item.id}`,
          title: item.title,
          description: item.description,
          status: item.status === "in-progress" ? "in-progress" : "backlog",
          priority: item.priority,
          assignedAgent: item.assignedAgent,
          progress: item.status === "in-progress" ? 25 : 0,
          createdAt: Date.now(),
          tags: [item.phase],
          sourceRoadmapId: item.id,
          dependencies: item.dependencies.map(d => `task-${d}`),
        }
        return task
      })
      
      setStore(produce(s => {
        for (const task of newTasks) {
          if (!s.kanbanTasks.find(t => t.id === task.id)) {
            s.kanbanTasks.push(task)
          }
        }
      }))
      
      return newTasks
    },
    
    // Kanban operations
    addTask: (task) => {
      setStore(produce(s => {
        if (!s.kanbanTasks.find(t => t.id === task.id)) {
          s.kanbanTasks.push(task)
        }
      }))
    },
    
    updateTask: (taskId, updates) => {
      setStore(produce(s => {
        const task = s.kanbanTasks.find(t => t.id === taskId)
        if (task) {
          Object.assign(task, updates)
        }
      }))
    },
    
    removeTask: (taskId) => {
      setStore(produce(s => {
        s.kanbanTasks = s.kanbanTasks.filter(t => t.id !== taskId)
      }))
    },
    
    // Utility
    reset: () => {
      setStore({
        acceptedIdeas: [],
        roadmapItems: [],
        kanbanTasks: [],
      })
    },
  }

  return (
    <WorkflowContext.Provider value={[store, actions]}>
      {props.children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflow() {
  const context = useContext(WorkflowContext)
  if (!context) {
    throw new Error("useWorkflow must be used within a WorkflowProvider")
  }
  return context
}
