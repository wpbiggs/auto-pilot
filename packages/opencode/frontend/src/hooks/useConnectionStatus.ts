/**
 * React Hook for SDK Connection Status
 * Provides real-time connection status with automatic polling and reconnection
 */

import { useState, useEffect, useCallback, useRef } from "react"
import type { ConnectionState, ConnectionStatus } from "../services/connection"
import { ConnectionPoller, getConnectionPoller } from "../services/connection"

export interface UseConnectionStatusOptions {
  /** Polling interval in ms (default: 10000) */
  pollInterval?: number
  /** SDK base URL */
  baseUrl?: string
  /** Enable auto-reconnect (default: true) */
  autoReconnect?: boolean
  /** Start polling immediately (default: true) */
  autoStart?: boolean
}

export interface UseConnectionStatusResult {
  /** Current connection status */
  status: ConnectionStatus
  /** Whether SDK is connected */
  isConnected: boolean
  /** Whether currently attempting to connect */
  isConnecting: boolean
  /** Last time connection was checked */
  lastChecked: Date | null
  /** Last time connection was successful */
  lastConnected: Date | null
  /** Number of reconnect attempts since last successful connection */
  reconnectAttempts: number
  /** Last error message if any */
  error?: string
  /** Force an immediate connection check */
  checkNow: () => Promise<boolean>
  /** Manually trigger reconnection */
  reconnect: () => Promise<boolean>
  /** Start polling */
  start: () => void
  /** Stop polling */
  stop: () => void
}

export function useConnectionStatus(
  options: UseConnectionStatusOptions = {}
): UseConnectionStatusResult {
  const {
    pollInterval = 10000,
    baseUrl = "http://127.0.0.1:4096",
    autoReconnect = true,
    autoStart = true,
  } = options

  const pollerRef = useRef<ConnectionPoller | null>(null)

  const [state, setState] = useState<ConnectionState>({
    status: "disconnected",
    lastChecked: null,
    lastConnected: null,
    reconnectAttempts: 0,
  })

  // Initialize poller
  useEffect(() => {
    const poller = getConnectionPoller({
      pollInterval,
      baseUrl,
      autoReconnect,
    })
    pollerRef.current = poller

    // Subscribe to state changes
    const unsubscribe = poller.subscribe((newState) => {
      setState(newState)
    })

    // Auto-start if enabled
    if (autoStart) {
      poller.start()
    }

    return () => {
      unsubscribe()
      // Don't stop the global poller on unmount - other components may use it
    }
  }, [pollInterval, baseUrl, autoReconnect, autoStart])

  const checkNow = useCallback(async (): Promise<boolean> => {
    if (pollerRef.current) {
      return pollerRef.current.checkNow()
    }
    return false
  }, [])

  const reconnect = useCallback(async (): Promise<boolean> => {
    if (pollerRef.current) {
      return pollerRef.current.reconnect()
    }
    return false
  }, [])

  const start = useCallback(() => {
    pollerRef.current?.start()
  }, [])

  const stop = useCallback(() => {
    pollerRef.current?.stop()
  }, [])

  return {
    status: state.status,
    isConnected: state.status === "connected",
    isConnecting: state.status === "connecting" || state.status === "reconnecting",
    lastChecked: state.lastChecked,
    lastConnected: state.lastConnected,
    reconnectAttempts: state.reconnectAttempts,
    error: state.error,
    checkNow,
    reconnect,
    start,
    stop,
  }
}

export default useConnectionStatus
