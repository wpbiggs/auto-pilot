import { createSignal, onCleanup, createEffect } from "solid-js"

export interface SessionUpdate {
  sessionId: string
  type: "progress" | "status" | "token" | "completion"
  data: any
}

export interface WebSocketMessage {
  type: "session_update" | "agent_status" | "task_update" | "notification"
  payload: any
}

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map()
  private connectionState = createSignal<"connecting" | "connected" | "disconnected" | "error">("disconnected")

  connect(url?: string) {
    const wsUrl = url || this.getWebSocketUrl()
    
    try {
      this.ws = new WebSocket(wsUrl)
      this.connectionState[1]("connecting")
      
      this.ws.onopen = () => {
        console.log("[WebSocket] Connected")
        this.connectionState[1]("connected")
        this.reconnectAttempts = 0
      }
      
      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error)
        }
      }
      
      this.ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error)
        this.connectionState[1]("error")
      }
      
      this.ws.onclose = () => {
        console.log("[WebSocket] Disconnected")
        this.connectionState[1]("disconnected")
        this.attemptReconnect()
      }
    } catch (error) {
      console.error("[WebSocket] Connection failed:", error)
      this.connectionState[1]("error")
      this.attemptReconnect()
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    } else {
      console.warn("[WebSocket] Cannot send - not connected")
    }
  }

  subscribe(type: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }
    this.messageHandlers.get(type)!.add(handler)
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type)
      if (handlers) {
        handlers.delete(handler)
      }
    }
  }

  getConnectionState() {
    return this.connectionState[0]
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.payload)
        } catch (error) {
          console.error(`[WebSocket] Handler error for ${message.type}:`, error)
        }
      })
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect()
      }, delay)
    } else {
      console.error("[WebSocket] Max reconnect attempts reached")
    }
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = window.location.host
    return `${protocol}//${host}/ws`
  }
}

// Singleton instance
export const wsService = new WebSocketService()

// Hook for components to use WebSocket
export function useWebSocket() {
  createEffect(() => {
    wsService.connect()
    
    onCleanup(() => {
      // Don't disconnect on component unmount - keep connection alive
      // wsService.disconnect()
    })
  })
  
  return wsService
}

// Hook for session updates
export function useSessionUpdates(onUpdate: (update: SessionUpdate) => void) {
  createEffect(() => {
    const unsubscribe = wsService.subscribe("session_update", onUpdate)
    
    onCleanup(() => {
      unsubscribe()
    })
  })
}

// Hook for agent status
export function useAgentStatus(onUpdate: (status: any) => void) {
  createEffect(() => {
    const unsubscribe = wsService.subscribe("agent_status", onUpdate)
    
    onCleanup(() => {
      unsubscribe()
    })
  })
}
