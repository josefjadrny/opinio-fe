import { TierCard, type TierTone } from './TierCard';
import { useI18n } from '../../i18n/I18nContext';

// The three-tier "Plans" grid — shared by WelcomeModal (display-only) and
// AboutModal (interactive: click to sign in / open Stripe Checkout). Behaviour
// is driven by props so the same layout serves both:
//   - activeTier        which card shows the "current tier" badge
//   - onRegisteredClick / onSupporterClick   make those cards clickable
//   - supporterDisabled toggles the wait state during checkout redirect
//   - showSupporterPrice renders the €3.49/mo price-tag overhang
export function Plans({
  activeTier,
  onRegisteredClick,
  onSupporterClick,
  supporterDisabled,
  showSupporterPrice,
}: {
  activeTier: TierTone;
  onRegisteredClick?: () => void;
  onSupporterClick?: () => void;
  supporterDisabled?: boolean;
  showSupporterPrice?: boolean;
}) {
  const { t, p } = useI18n();
  // Poll rules: anonymous 1 vote a day; signed in, unlimited and can create
  // polls. Supporter gets no poll benefit for now (decided) - it keeps the
  // site running.
  return (
    <div>
      <p className="text-sm font-semibold text-white mb-3">{t.aboutTiersTitle}</p>
      <div className="grid grid-cols-3 gap-2">
        <TierCard label={t.aboutTierAnonymous} count={1} unit={p.planPerDay} tone="muted" active={activeTier === 'muted'} />
        <TierCard
          label={t.aboutTierRegistered}
          count="∞"
          unit={p.planUnlimited}
          promo={[p.planRegisteredPromo, p.planRegisteredComments, p.planRegisteredNotifications]}
          tone="accent"
          active={activeTier === 'accent'}
          onClick={onRegisteredClick}
        />
        <div className="relative h-full">
          <TierCard
            label={t.aboutTierSupporter}
            count="∞"
            unit={p.planUnlimited}
            promo={p.planSupporterPromo}
            trailingIcon={<span aria-hidden className="text-[11px] leading-none">❤️</span>}
            tone="positive"
            active={activeTier === 'positive'}
            onClick={onSupporterClick}
            disabled={supporterDisabled}
          />
          {/* Price tag — top-right corner overhang, mutually exclusive with the
              active badge, so they never collide. Absolutely positioned, so it
              doesn't add to card height. */}
          {showSupporterPrice && (
            <span className="pointer-events-none absolute -top-[7px] -right-1 whitespace-nowrap rounded-full bg-amber-400 text-amber-950 text-[12px] font-bold px-2 py-0.5 shadow leading-none">
              {t.aboutSupporterPriceNote}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
