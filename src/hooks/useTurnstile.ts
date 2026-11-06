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
      const done = (fn: () => void) => { try { api.remove(id); } catch { /* gone */ } fn(); };
      id = api.render(el, {
        sitekey: SITE_KEY,
        appearance: 'interaction-only',
        theme: 'dark',
        callback: (token: string) => done(() => resolve(token)),
        'error-callback': () => done(() => reject(new Error('turnstile error'))),
        'expired-callback': () => done(() => reject(new Error('turnstile expired'))),
      });
    });
  }, []);

  return { containerRef, getToken };
}
