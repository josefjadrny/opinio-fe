import { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { HoverTip } from '../common/HoverTip';

// The quiet icon button every window header carries (ModalShell's close).
const HEADER_BTN = 'text-white/40 hover:text-white/80 transition-colors p-1';

// A story's share: the system share sheet where there is one (phones), else
// the link to the clipboard. Shared by the desktop story header and the
// mobile sheet's header.
export function ShareLink() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.origin + window.location.pathname;
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title: document.title, url }); } catch { /* dismissed */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t.linkCopied, url);
    }
  }
  return (
    <HoverTip label={copied ? t.linkCopied : t.share}>
      <button onClick={share} aria-label={t.share} className={HEADER_BTN}>
        {copied ? (
          <svg className="w-5 h-5 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        )}
      </button>
    </HoverTip>
  );
}
