/**
 * SDK Connection Poller Service
 * Automatically monitors SDK connection status and triggers reconnection
 */

import { checkSDKConnection } from "./execution"

export type ConnectionStatus = "connected" | "disconnected" | "connecting" | "reconnecting"

export interface ConnectionState {
  status: ConnectionStatus
  lastChecked: Date | null
  lastConnected: Date | null
  reconnectAttempts: number
  error?: string
}

export type ConnectionListener = (state: ConnectionState) => void

interface ConnectionPollerOptions {
  /** Polling interval in milliseconds (default: 10000 = 10 seconds) */
  pollInterval?: number
  /** Base URL for SDK server */
  baseUrl?: string
  /** Max reconnect attempts before giving up (default: Infinity) */
  maxReconnectAttempts?: number
  /** Delay between reconnect attempts in ms (default: 2000) */
  reconnectDelay?: number
  /** Enable auto-reconnect (default: true) */
  autoReconnect?: boolean
}

/**
 * Connection Poller Class
 * Manages SDK connection status polling and auto-reconnection
 */
export class ConnectionPoller {
  private state: ConnectionState = {
    status: "disconnected",
    lastChecked: null,
    lastConnected: null,
    reconnectAttempts: 0,
  }

  private listeners: Set<ConnectionListener> = new Set()
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private isPolling = false

  private options: Required<ConnectionPollerOptions>

  constructor(options: ConnectionPollerOptions = {}) {
    this.options = {
      pollInterval: options.pollInterval ?? 10000,
      baseUrl: options.baseUrl ?? "http://127.0.0.1:4096",
      maxReconnectAttempts: options.maxReconnectAttempts ?? Infinity,
      reconnectDelay: options.reconnectDelay ?? 2000,
      autoReconnect: options.autoReconnect ?? true,
    }
  }

  /** Get current connection state */
  getState(): ConnectionState {
    return { ...this.state }
  }

  /** Subscribe to connection state changes */
  subscribe(listener: ConnectionListener): () => void {
    this.listeners.add(listener)
    // Immediately notify with current state
    listener(this.getState())
    return () => this.listeners.delete(listener)
  }

  /** Start polling for connection status */
  start(): void {
    if (this.isPolling) return
    this.isPolling = true
    console.log("[ConnectionPoller] Starting connection polling every", this.options.pollInterval, "ms")
    
    // Check immediately
    this.checkConnection()
    
    // Then poll at interval
    this.pollTimer = setInterval(() => {
      this.checkConnection()
    }, this.options.pollInterval)
  }

  /** Stop polling */
  stop(): void {
    this.isPolling = false
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    console.log("[ConnectionPoller] Stopped connection polling")
  }

  /** Force an immediate connection check */
  async checkNow(): Promise<boolean> {
    return this.checkConnection()
  }

  /** Manually trigger a reconnection attempt */
  async reconnect(): Promise<boolean> {
    this.updateState({ status: "reconnecting", reconnectAttempts: this.state.reconnectAttempts + 1 })
    return this.checkConnection()
  }

  private async checkConnection(): Promise<boolean> {
    const previousStatus = this.state.status
    const wasConnected = previousStatus === "connected"
    
    // Update to connecting/checking state if not already in a transitional state
    if (previousStatus === "disconnected") {
      this.updateState({ status: "connecting" })
    }

    try {
      console.log("[ConnectionPoller] Checking SDK connection...")
      const isConnected = await checkSDKConnection(this.options.baseUrl)
      
      const now = new Date()
      
      if (isConnected) {
        this.updateState({
          status: "connected",
          lastChecked: now,
          lastConnected: now,
          reconnectAttempts: 0,
          error: undefined,
        })
        
        if (!wasConnected) {
          console.log("[ConnectionPoller] ✅ SDK Connected!")
        }
        return true
      } else {
        this.handleDisconnection(wasConnected, now)
        return false
      }
    } catch (error: any) {
      const now = new Date()
      this.handleDisconnection(wasConnected, now, error.message)
      return false
    }
  }

  private handleDisconnection(wasConnected: boolean, now: Date, error?: string): void {
    const reconnectAttempts = wasConnected ? 1 : this.state.reconnectAttempts

    this.updateState({
      status: "disconnected",
      lastChecked: now,
      reconnectAttempts,
      error: error ?? "SDK not responding",
    })

    if (wasConnected) {
      console.log("[ConnectionPoller] ⚠️ SDK Connection lost!")
    }

    // Auto-reconnect if enabled
    if (this.options.autoReconnect && reconnectAttempts < this.options.maxReconnectAttempts) {
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    
    const delay = Math.min(
      this.options.reconnectDelay * Math.pow(1.5, this.state.reconnectAttempts - 1),
      30000 // Max 30 seconds between attempts
    )

    console.log(`[ConnectionPoller] Scheduling reconnect in ${delay}ms (attempt ${this.state.reconnectAttempts + 1})`)
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.isPolling && this.state.status === "disconnected") {
        this.updateState({ status: "reconnecting" })
        this.checkConnection()
      }
    }, delay)
  }

  private updateState(partial: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...partial }
    this.notifyListeners()
  }

  private notifyListeners(): void {
    const state = this.getState()
    this.listeners.forEach(listener => {
      try {
        listener(state)
      } catch (e) {
        console.error("[ConnectionPoller] Listener error:", e)
      }
    })
  }
}

// Singleton instance for global use
let globalPoller: ConnectionPoller | null = null

export function getConnectionPoller(options?: ConnectionPollerOptions): ConnectionPoller {
  if (!globalPoller) {
    globalPoller = new ConnectionPoller(options)
  }
  return globalPoller
}

export function resetConnectionPoller(): void {
  if (globalPoller) {
    globalPoller.stop()
    globalPoller = null
  }
}
