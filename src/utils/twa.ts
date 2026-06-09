// Detects whether the app is running inside the Android TWA (the Play Store
// build), as opposed to a regular mobile browser or an installed web PWA.
//
// A TWA sets document.referrer to `android-app://<package>` on the launch
// navigation. We latch that to sessionStorage so the verdict survives the SPA's
// client-side routing (where document.referrer can change after navigation).
//
// Why: Google Play forbids selling digital goods/subscriptions inside a Play app
// outside Play Billing. The Supporter (Stripe) purchase flow must therefore be
// non-purchasable inside the TWA. Installed web PWAs are NOT a TWA (they launch
// from the browser, not android-app://), so they keep the normal Stripe flow.
const TWA_REFERRER_PREFIX = 'android-app://live.opinio.app';
const STORAGE_KEY = 'opinio:isTwa';

export function isTwa(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') return true;
    if (document.referrer.startsWith(TWA_REFERRER_PREFIX)) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      return true;
    }
  } catch {
    // sessionStorage can throw (private mode / blocked storage) — fall back to
    // the raw referrer check without latching.
    return document.referrer.startsWith(TWA_REFERRER_PREFIX);
  }
  return false;
}
