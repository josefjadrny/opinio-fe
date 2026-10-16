import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Profile } from '../types/profile';
import type { NewsItem } from '../types/api';
import { getNews, getProfile, isNotFound } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

const API_URL = import.meta.env.OPINIO_API_URL as string;
const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws';

const QUEUE_CAP = 6;
const RECONNECT_INITIAL_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const VISIBILITY_GRACE_MS = 60_000;

type Message =
  | { type: 'hello' }
  | { type: 'profile_created'; profile: Profile }
  | { type: 'news_created'; newsId: string };

// What the live banner shows, in arrival order. One queue for both kinds: they
// share the banner's slot, so a news item waits its turn behind a new opinio
// and the other way round.
export type LiveItem =
  | { kind: 'opinio'; profile: Profile }
  | { kind: 'news'; news: NewsItem };

export function useRealtimeFeed(enabled: boolean) {
  const [queue, setQueue] = useState<LiveItem[]>([]);
  const queueRef = useRef<LiveItem[]>([]);
  queueRef.current = queue;

  // Keep the active locale in a ref so the WS effect (keyed only on `enabled`)
  // reads the current value without reconnecting the socket on every language
  // switch.
  const { locale } = useI18n();
  // Stable for the app's lifetime, so listing it in the socket effect's deps
  // never reconnects.
  const queryClient = useQueryClient();
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

    const push = (item: LiveItem) => {
      if (stoppedRef.current) return;
      setQueue((q) => (q.length >= QUEUE_CAP ? q : [...q, item]));
    };

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
          // 6 × 14s isn't really "new".
          if (queueRef.current.length >= QUEUE_CAP) return;
          const original = msg.profile;
          // Pull the profile in the viewer's own locale so the banner shows
          // translated text. The BE fires this ping only after translation has
          // landed, so this (5s-cached) refetch returns the translated row.
          // Fall back to the pushed original payload on any error except a 404
          // (the profile was deleted in the gap — drop it silently).
          getProfile(original.id, localeRef.current)
            .then((fresh) => push({ kind: 'opinio', profile: fresh }))
            .catch((err) => {
              if (isNotFound(err)) return;
              push({ kind: 'opinio', profile: original });
            });
        }
        if (msg.type === 'news_created' && msg.newsId) {
          // The map caption's rotation reads the latest list; refresh it now
          // rather than on its next minute's poll (the API dropped its cached
          // copy on the same event), even if the banner queue is full.
          queryClient.invalidateQueries({ queryKey: ['news', 'latest'] });
          if (queueRef.current.length >= QUEUE_CAP) return;
          // Only the id is pushed; the item is read in the viewer's locale
          // (sent after its translation landed). Nothing to fall back to, so a
          // failed read drops it.
          getNews(msg.newsId, localeRef.current)
            .then((news) => push({ kind: 'news', news }))
            .catch(() => {});
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
  }, [enabled, queryClient]);

  return { next: queue[0], dequeue, queueLength: queue.length };
}
