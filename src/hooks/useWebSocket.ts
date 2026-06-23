'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { djangoClient } from '@/lib/apiClient';
import { getGuestId } from '@/lib/guest';

/**
 * WebSocket message received from the server.
 */
export interface WsMessage {
  type: string;
  user_id?: string;
  title?: string;
  payload?: Record<string, unknown>;
}

interface UseWebSocketOptions {
  /** Called when a non-pong message is received */
  onMessage?: (message: WsMessage) => void;
  /** Called when WebSocket connects */
  onConnect?: () => void;
  /** Called when WebSocket disconnects */
  onDisconnect?: () => void;
}

interface UseWebSocketReturn {
  /** Whether the WebSocket is currently connected */
  isConnected: boolean;
  /** The last message received */
  lastMessage: WsMessage | null;
  /** Send a raw text message (mainly for debugging) */
  sendMessage: (data: string) => void;
}

// ── Constants ────────────────────────────────────────────────
const HEARTBEAT_INTERVAL_MS = 20_000;        // Ping every 20s
const INITIAL_RECONNECT_DELAY_MS = 1_000;    // Start at 1s
const MAX_RECONNECT_DELAY_MS = 16_000;       // Cap at 16s

/**
 * Custom hook for WebSocket connection with:
 * - JWT authentication via short-lived ws-token
 * - Heartbeat ping/pong (20s interval)
 * - Exponential backoff auto-reconnection (1s → 2s → 4s → 8s → 16s)
 * - Automatic cleanup on unmount or logout
 *
 * Usage:
 * ```tsx
 * const { isConnected, lastMessage } = useWebSocket({
 *   onMessage: (msg) => {
 *     if (msg.type === 'score_complete') { ... }
 *   },
 * });
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const optionsRef = useRef(options);
  
  // Keep options ref up-to-date without triggering re-renders or effect re-runs
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY_MS);
  const isMountedRef = useRef(true);
  const isConnectingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Read auth state outside of effect to avoid stale closures
  const { isAuthenticated, user } = useAuthStore();

  // ── Cleanup helpers ──────────────────────────────────────
  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // ── Core connect function ────────────────────────────────
  const connect = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    // Abort any in-flight token request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Close any existing socket to prevent leaks
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }

    const guestId = !isAuthenticated ? getGuestId() : null;
    const effectiveUserId = isAuthenticated ? user?.id : guestId;

    if (!effectiveUserId) return;

    isConnectingRef.current = true;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Step 1: Obtain short-lived WS token (2-minute TTL)
      const { data } = await djangoClient.post('/users/ws-token/', {
        guest_id: guestId
      }, {
        signal: abortController.signal
      });
      
      if (abortController.signal.aborted) return;
      
      const wsToken = data.ws_token;
      const actualUserId = data.user_id;

      if (!isMountedRef.current) return;

      // Step 2: Determine WS URL
      let baseWsUrl = process.env.NEXT_PUBLIC_WS_URL;
      
      if (!baseWsUrl && process.env.NEXT_PUBLIC_API_URL) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const wsProtocol = apiUrl.startsWith('https:') ? 'wss:' : 'ws:';
        const host = apiUrl.replace(/^https?:\/\//, '');
        baseWsUrl = `${wsProtocol}//${host}/ws`;
      }
      
      if (!baseWsUrl) {
        baseWsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}/ws`;
      }

      const cleanBaseWsUrl = baseWsUrl.endsWith('/') ? baseWsUrl.slice(0, -1) : baseWsUrl;
      const wsUrl = `${cleanBaseWsUrl}/${actualUserId}?token=${wsToken}`;

      // Step 3: Create WebSocket
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (abortController.signal.aborted || !isMountedRef.current) {
          socket.close();
          return;
        }

        setIsConnected(true);
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
        isConnectingRef.current = false;
        optionsRef.current.onConnect?.();

        // Start heartbeat — send "ping" every 20s
        clearHeartbeat();
        heartbeatRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, HEARTBEAT_INTERVAL_MS);
      };

      socket.onmessage = (event) => {
        if (abortController.signal.aborted || !isMountedRef.current) return;

        // Ignore pong responses
        if (event.data === 'pong') return;

        try {
          const message: WsMessage = JSON.parse(event.data);
          setLastMessage(message);
          optionsRef.current.onMessage?.(message);
        } catch {
          // Non-JSON message, ignore
        }
      };

      socket.onclose = () => {
        if (abortController.signal.aborted || !isMountedRef.current) return;

        clearHeartbeat();
        setIsConnected(false);
        isConnectingRef.current = false;
        optionsRef.current.onDisconnect?.();

        // Schedule reconnection with exponential backoff
        const delay = reconnectDelayRef.current;
        console.log(`[WS] Disconnected. Reconnecting in ${delay / 1000}s...`);

        clearReconnectTimeout();
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(
            reconnectDelayRef.current * 2,
            MAX_RECONNECT_DELAY_MS,
          );
          connect();
        }, delay);
      };

      socket.onerror = () => {
        socket.close();
      };

    } catch (error: any) {
      if (error.name === 'CanceledError' || abortController.signal.aborted) {
        return; // Connection attempt was aborted, ignore error
      }
      
      console.error('[WS] Failed to obtain ws-token:', error);
      isConnectingRef.current = false;

      // Retry after backoff
      const delay = reconnectDelayRef.current;
      clearReconnectTimeout();
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectDelayRef.current = Math.min(
          reconnectDelayRef.current * 2,
          MAX_RECONNECT_DELAY_MS,
        );
        connect();
      }, delay);
    }
  }, [isAuthenticated, user?.id, clearHeartbeat, clearReconnectTimeout]);

  // ── Send message helper ──────────────────────────────────
  const sendMessage = useCallback((data: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    }
  }, []);

  // ── Effect: connect/disconnect based on auth state ───────
  useEffect(() => {
    isMountedRef.current = true;

    connect();

    return () => {
      isMountedRef.current = false;
      clearHeartbeat();
      clearReconnectTimeout();

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      if (socketRef.current) {
        socketRef.current.onclose = null; // Prevent reconnection on cleanup
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id, connect]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isConnected, lastMessage, sendMessage };
}
