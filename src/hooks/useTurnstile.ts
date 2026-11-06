import { useCallback, useRef } from 'react';

// Cloudflare Turnstile, loaded and rendered only when an anonymous visitor
// presses a vote (POLLS-DESIGN.md: browsing stays clean). The widget runs in
// "interaction-only" appearance: invisible unless Cloudflare wants a click,
// in which case it shows inside the container this hook hands out.

const SITE_KEY = import.meta.env.OPINIO_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT_URL;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { scriptPromise = null; reject(new Error('turnstile script failed')); };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export function useTurnstile() {
  const containerRef = useRef<HTMLDivElement>(null);

  // One fresh token per vote; the widget is removed once it has answered.
  const getToken = useCallback(async (): Promise<string> => {
    if (!SITE_KEY) throw new Error('no turnstile site key');
    await loadScript();
    const el = containerRef.current;
    const api = window.turnstile;
    if (!el || !api) throw new Error('turnstile not ready');
    return new Promise<string>((resolve, reject) => {
      let id = '';
      let settled = false;
      // Cloudflare is showing its click box: leave it alone.
      let interactive = false;
      const timers: number[] = [];
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        timers.forEach((t) => window.clearTimeout(t));
        try { api.remove(id); } catch { /* gone */ }
        fn();
      };
      const fail = (why: string) => () => finish(() => reject(new Error('turnstile ' + why)));
      const render = (appearance: 'interaction-only' | 'always') => api.render(el, {
        sitekey: SITE_KEY,
        appearance,
        theme: 'dark',
        callback: (token: string) => finish(() => resolve(token)),
        'error-callback': fail('error'),
        'expired-callback': fail('expired'),
        'timeout-callback': fail('timeout'),
        'unsupported-callback': fail('unsupported'),
        'before-interactive-callback': () => { interactive = true; },
      });
      id = render('interaction-only');
      // An invisible check normally answers within a couple of seconds. One
      // that has not after 8s is swapped for Cloudflare's visible widget, so
      // the visitor sees what it is doing (and can click it) instead of a
      // silent "Checking..." that never moves - which is what prod showed.
      timers.push(window.setTimeout(() => {
        if (settled || interactive) return;
        try { api.remove(id); } catch { /* gone */ }
        id = render('always');
      }, 8_000));
      // Never wait forever: give up and let the visitor press again.
      timers.push(window.setTimeout(fail('gave up'), 60_000));
    });
  }, []);

  return { containerRef, getToken };
}
