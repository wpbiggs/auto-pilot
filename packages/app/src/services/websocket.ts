/**
 * WebSocket Service for Real-time Execution Updates
 * Extends the base websocket service with execution-specific functionality
 */

import { createSignal, onCleanup } from "solid-js"
import type { StatusUpdate, ExecutionStatus } from "@/types/agent-status"
import type { TaskUpdate, TaskProgress } from "@/types/task"

export type ExecutionMessage = 
  | { type: "execution_update"; payload: StatusUpdate }
  | { type: "task_update"; payload: TaskUpdate }
  | { type: "status_sync"; payload: ExecutionStatus }

type MessageHandler<T> = (data: T) => void

class ExecutionWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private handlers = new Map<string, Set<MessageHandler<any>>>()
  private connectionStateSignal = createSignal<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected")
  private pendingMessages: Array<{ type: string; payload: any }> = []

  private get connectionState() {
    return this.connectionStateSignal[0]
  }

  private setConnectionState(state: "connecting" | "connected" | "disconnected" | "error") {
    this.connectionStateSignal[1](state)
  }

  connect(url?: string): void {
    const wsUrl = url || this.getWebSocketUrl()
    
    try {
      this.setConnectionState("connecting")
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log("[ExecutionWS] Connected")
        this.setConnectionState("connected")
        this.reconnectAttempts = 0
        
        // Send any pending messages
        while (this.pendingMessages.length > 0) {
          const msg = this.pendingMessages.shift()!
          this.send(msg.type, msg.payload)
        }
      }
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ExecutionMessage
          this.handleMessage(message)
        } catch (error) {
          console.error("[ExecutionWS] Parse error:", error)
        }
      }
      
      this.ws.onerror = (error) => {
        console.error("[ExecutionWS] Error:", error)
        this.setConnectionState("error")
      }
      
      this.ws.onclose = () => {
        console.log("[ExecutionWS] Disconnected")
        this.setConnectionState("disconnected")
        this.attemptReconnect()
      }
    } catch (error) {
      console.error("[ExecutionWS] Connection failed:", error)
      this.setConnectionState("error")
      this.attemptReconnect()
    }
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts // Prevent reconnect
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.setConnectionState("disconnected")
  }

  send(type: string, payload: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }))
    } else {
      // Queue for when connection is established
      this.pendingMessages.push({ type, payload })
      
      // Try to connect if not already
      if (this.connectionState() === "disconnected") {
        this.connect()
      }
    }
  }

  subscribe<T>(type: string, handler: MessageHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
    
    return () => {
      const typeHandlers = this.handlers.get(type)
      if (typeHandlers) {
        typeHandlers.delete(handler)
      }
    }
  }

  onExecutionUpdate(handler: MessageHandler<StatusUpdate>): () => void {
    return this.subscribe("execution_update", handler)
  }

  onTaskUpdate(handler: MessageHandler<TaskUpdate>): () => void {
    return this.subscribe("task_update", handler)
  }

  onStatusSync(handler: MessageHandler<ExecutionStatus>): () => void {
    return this.subscribe("status_sync", handler)
  }

  getConnectionState() {
    return this.connectionState
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private handleMessage(message: ExecutionMessage): void {
    const handlers = this.handlers.get(message.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.payload)
        } catch (error) {
          console.error(`[ExecutionWS] Handler error for ${message.type}:`, error)
        }
      })
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[ExecutionWS] Max reconnect attempts reached")
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`[ExecutionWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      if (this.connectionState() !== "connected") {
        this.connect()
      }
    }, delay)
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = import.meta.env.VITE_WS_HOST || window.location.host
    return `${protocol}//${host}/ws/execution`
  }
}

export const executionWebSocket = new ExecutionWebSocket()

/**
 * Hook for using execution websocket in components
 */
export function useExecutionWebSocket() {
  const [status, setStatus] = createSignal<ExecutionStatus | null>(null)
  
  const unsubscribe = executionWebSocket.onStatusSync((newStatus) => {
    setStatus(newStatus)
  })
  
  onCleanup(() => {
    unsubscribe()
  })
  
  return {
    status,
    connectionState: executionWebSocket.getConnectionState,
    subscribe: executionWebSocket.subscribe.bind(executionWebSocket),
    send: executionWebSocket.send.bind(executionWebSocket)
  }
}
