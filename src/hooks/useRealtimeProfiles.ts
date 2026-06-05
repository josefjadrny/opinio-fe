import { useEffect, useRef, useState, useCallback } from 'react';
import type { Profile } from '../types/profile';
import { getProfile, isNotFound } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

const API_URL = import.meta.env.OPINIO_API_URL as string;
const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws';

const QUEUE_CAP = 6;
const RECONNECT_INITIAL_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const VISIBILITY_GRACE_MS = 60_000;

type Message = { type: 'hello' } | { type: 'profile_created'; profile: Profile };

export function useRealtimeProfiles(enabled: boolean) {
  const [queue, setQueue] = useState<Profile[]>([]);
  const queueRef = useRef<Profile[]>([]);
  queueRef.current = queue;

  // Keep the active locale in a ref so the WS effect (keyed only on `enabled`)
  // reads the current value without reconnecting the socket on every language
  // switch.
  const { locale } = useI18n();
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const visibilityTimerRef = useRef<number | null>(null);
  const backoffRef = useRef(RECONNECT_INITIAL_MS);
  const stoppedRef = useRef(false);

  const dequeue = useCallback(() => {
    setQueue((q) => (q.length ? q.slice(1) : q));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    stoppedRef.current = false;

    const connect = () => {
      if (stoppedRef.current) return;
      let ws: WebSocket;
      try {
        ws = new WebSocket(WS_URL);
      } catch {
        scheduleReconnect();
        return;
      }
      socketRef.current = ws;

      ws.onmessage = (ev) => {
        let msg: Message;
        try { msg = JSON.parse(ev.data); } catch { return; }
        if (msg.type === 'hello') {
          backoffRef.current = RECONNECT_INITIAL_MS;
          return;
        }
        if (msg.type === 'profile_created' && msg.profile?.id) {
          // Bail early when the queue is already full — anything older than
          // 6 × 10s isn't really "new".
          if (queueRef.current.length >= QUEUE_CAP) return;
          const original = msg.profile;
          // Pull the profile in the viewer's own locale so the banner shows
          // translated text. The BE fires this ping only after translation has
          // landed, so this (5s-cached) refetch returns the translated row.
          // Fall back to the pushed original payload on any error except a 404
          // (the profile was deleted in the gap — drop it silently).
          getProfile(original.id, localeRef.current)
            .then((fresh) => {
              if (stoppedRef.current) return;
              setQueue((q) => (q.length >= QUEUE_CAP ? q : [...q, fresh]));
            })
            .catch((err) => {
              if (stoppedRef.current || isNotFound(err)) return;
              setQueue((q) => (q.length >= QUEUE_CAP ? q : [...q, original]));
            });
        }
      };

      ws.onclose = () => {
        setQueue([]); // user-confirmed: drop in-flight queue on disconnect
        socketRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = () => {
        try { ws.close(); } catch { /* noop */ }
      };
    };

    const scheduleReconnect = () => {
      if (stoppedRef.current) return;
      if (reconnectTimerRef.current != null) return;
      const delay = backoffRef.current;
      backoffRef.current = Math.min(RECONNECT_MAX_MS, backoffRef.current * 2);
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (visibilityTimerRef.current != null) return;
        visibilityTimerRef.current = window.setTimeout(() => {
          visibilityTimerRef.current = null;
          if (document.hidden && socketRef.current) {
            try { socketRef.current.close(); } catch { /* noop */ }
          }
        }, VISIBILITY_GRACE_MS);
      } else {
        if (visibilityTimerRef.current != null) {
          clearTimeout(visibilityTimerRef.current);
          visibilityTimerRef.current = null;
        }
        if (!socketRef.current) {
          backoffRef.current = RECONNECT_INITIAL_MS;
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    connect();

    return () => {
      stoppedRef.current = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (reconnectTimerRef.current != null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (visibilityTimerRef.current != null) {
        clearTimeout(visibilityTimerRef.current);
        visibilityTimerRef.current = null;
      }
      const ws = socketRef.current;
      socketRef.current = null;
      if (ws) {
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        try { ws.close(); } catch { /* noop */ }
      }
    };
  }, [enabled]);

  return { next: queue[0], dequeue, queueLength: queue.length };
}
