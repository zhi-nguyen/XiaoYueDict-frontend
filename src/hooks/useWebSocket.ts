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

// ── Global WebSocket State (Singleton) ──────────────────────────
let globalSocket: WebSocket | null = null;
let globalIsConnected = false;
let globalLastMessage: WsMessage | null = null;

// Registry of active hook instances' listeners
const globalListeners = new Set<(message: WsMessage) => void>();
const globalConnectListeners = new Set<() => void>();
const globalDisconnectListeners = new Set<() => void>();

let isConnecting = false;
let tokenAbortController: AbortController | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let reconnectDelay = 1000;
let lastUsedIdentity: { isAuthenticated: boolean; userId?: string } | null = null;

// ── Constants ────────────────────────────────────────────────
const HEARTBEAT_INTERVAL_MS = 20_000;        // Ping every 20s
const INITIAL_RECONNECT_DELAY_MS = 1_000;    // Start at 1s
const MAX_RECONNECT_DELAY_MS = 16_000;       // Cap at 16s

function clearHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

function clearReconnectTimeout() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}

function sendGlobalMessage(data: string) {
  if (globalSocket?.readyState === WebSocket.OPEN) {
    globalSocket.send(data);
  }
}

// ── Core shared connection manager ───────────────────────────
async function connectGlobal(isAuthenticated: boolean, user: any, isAuthLoading: boolean) {
  if (isAuthLoading) return;

  const guestId = !isAuthenticated ? getGuestId() : null;
  const effectiveUserId = isAuthenticated ? user?.id : guestId;

  if (!effectiveUserId) return;

  const currentIdentityKey = { isAuthenticated, userId: effectiveUserId };
  const identityChanged = !lastUsedIdentity ||
    lastUsedIdentity.isAuthenticated !== currentIdentityKey.isAuthenticated ||
    lastUsedIdentity.userId !== currentIdentityKey.userId;

  // If already connected/connecting and user identity hasn't changed, reuse connection
  if (globalSocket && !identityChanged) {
    return;
  }

  // Update identity key
  lastUsedIdentity = currentIdentityKey;

  // Close previous connection if any
  isConnecting = true;
  clearHeartbeat();
  clearReconnectTimeout();
  if (tokenAbortController) {
    tokenAbortController.abort();
    tokenAbortController = null;
  }

  if (globalSocket) {
    globalSocket.onclose = null;
    globalSocket.onerror = null;
    globalSocket.close();
    globalSocket = null;
  }
  globalIsConnected = false;
  globalDisconnectListeners.forEach((cb) => cb());

  tokenAbortController = new AbortController();
  const signal = tokenAbortController.signal;

  try {
    // Step 1: Obtain short-lived WS token (2-minute TTL)
    const { data } = await djangoClient.get('/users/ws-token', {
      params: guestId ? { guest_id: guestId } : undefined,
      signal
    });

    if (signal.aborted) return;

    const wsToken = data.ws_token;
    const actualUserId = data.user_id;

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
    globalSocket = socket;

    socket.onopen = () => {
      if (signal.aborted) {
        socket.close();
        return;
      }

      globalIsConnected = true;
      isConnecting = false;
      reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
      globalConnectListeners.forEach((cb) => cb());

      // Start heartbeat
      clearHeartbeat();
      heartbeatInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send('ping');
        }
      }, HEARTBEAT_INTERVAL_MS);
    };

    socket.onmessage = (event) => {
      if (signal.aborted) return;

      // Ignore binary messages (such as Blob or ArrayBuffer)
      if (typeof event.data !== 'string') return;

      // Ignore pong responses
      if (event.data === 'pong') return;

      try {
        const message: WsMessage = JSON.parse(event.data);
        if (process.env.NODE_ENV !== 'production') {
          console.log('[useWebSocket] Received message:', message);
        }
        globalLastMessage = message;

        // Dispatch to all active listeners
        globalListeners.forEach((listener) => listener(message));

        // Dispatch global CustomEvents for static JS helper scripts
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ws_message_received', { detail: message }));
          if (message.type === 'tts_complete') {
            window.dispatchEvent(new CustomEvent('tts_task_completed', { detail: message.payload }));
          } else if (message.type === 'tts_failed') {
            window.dispatchEvent(new CustomEvent('tts_task_failed', { detail: message.payload }));
          } else if (message.type === 'flashcard_exercises_ready') {
            window.dispatchEvent(new CustomEvent('flashcard_exercises_ready', { detail: message.payload }));
          } else if (message.type === 'flashcard_exercises_failed') {
            window.dispatchEvent(new CustomEvent('flashcard_exercises_failed', { detail: message.payload }));
          } else if (message.type === 'writing_check_complete') {
            window.dispatchEvent(new CustomEvent('writing_check_complete', { detail: message.payload }));
          } else if (message.type === 'writing_check_failed') {
            window.dispatchEvent(new CustomEvent('writing_check_failed', { detail: message.payload }));
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[useWebSocket] Error parsing message:', err);
        }
      }
    };

    socket.onclose = () => {
      if (signal.aborted) return;

      clearHeartbeat();
      globalIsConnected = false;
      isConnecting = false;
      globalDisconnectListeners.forEach((cb) => cb());

      // Reconnect with exponential backoff
      const delay = reconnectDelay;
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[WS] Disconnected. Reconnecting in ${delay / 1000}s...`);
      }

      clearReconnectTimeout();
      reconnectTimeout = setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
        connectGlobal(isAuthenticated, user, isAuthLoading);
      }, delay);
    };

    socket.onerror = () => {
      socket.close();
    };

  } catch (error: any) {
    if (error.name === 'CanceledError' || signal.aborted) {
      return;
    }
    
    console.error('[WS] Failed to obtain ws-token:', error);
    isConnecting = false;
    globalIsConnected = false;

    // Retry after backoff
    const delay = reconnectDelay;
    clearReconnectTimeout();
    reconnectTimeout = setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
      connectGlobal(isAuthenticated, user, isAuthLoading);
    }, delay);
  }
}

/**
 * Persists a singleton global WebSocket connection shared across all hook invocations.
 * This prevents duplicate WebSocket handshakes, avoids token request spamming,
 * and ensures user background notifications are never missed due to page navigation.
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [isConnected, setIsConnected] = useState(globalIsConnected);
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(globalLastMessage);

  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuthStore();

  useEffect(() => {
    // Check and trigger global connection
    connectGlobal(isAuthenticated, user, isAuthLoading);

    // Sync initial state
    setIsConnected(globalIsConnected);

    // Local subscription callbacks to update state
    const handleMessage = (msg: WsMessage) => {
      setLastMessage(msg);
      optionsRef.current.onMessage?.(msg);
    };

    const handleConnect = () => {
      setIsConnected(true);
      optionsRef.current.onConnect?.();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      optionsRef.current.onDisconnect?.();
    };

    // Register listeners
    globalListeners.add(handleMessage);
    globalConnectListeners.add(handleConnect);
    globalDisconnectListeners.add(handleDisconnect);

    return () => {
      // Unsubscribe on unmount but KEEP global connection alive
      globalListeners.delete(handleMessage);
      globalConnectListeners.delete(handleConnect);
      globalDisconnectListeners.delete(handleDisconnect);
    };
  }, [isAuthenticated, isAuthLoading, user?.id]); // Only re-effect on identity changes

  return { isConnected, lastMessage, sendMessage: sendGlobalMessage };
}
