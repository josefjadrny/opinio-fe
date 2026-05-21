import { TierCard, type TierTone } from './TierCard';
import { useI18n } from '../../i18n/I18nContext';
import type { Strings } from '../../i18n/strings';

// Pick the votes-per-hour unit matching the count's plural category. Tier counts
// are 1/3/5, which map to one/few(2-4)/many(5+) — English & Spanish collapse
// few==many, Czech keeps all three (hlas / hlasy / hlasů).
function votesUnit(t: Strings, count: number): string {
  if (count === 1) return t.aboutVotesPerHourOne;
  if (count <= 4) return t.aboutVotesPerHourFew;
  return t.aboutVotesPerHourMany;
}

// The three-tier "Plans" grid — shared by WelcomeModal (display-only) and
// AboutModal (interactive: click to sign in / open Stripe Checkout). Behaviour
// is driven by props so the same layout serves both:
//   - activeTier        which card shows the "current tier" badge
//   - onRegisteredClick / onSupporterClick   make those cards clickable
//   - supporterDisabled toggles the wait state during checkout redirect
//   - showSupporterPrice renders the €2.99/mo price-tag overhang
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
  const { t } = useI18n();
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider font-semibold text-white/40 mb-2">{t.aboutTiersTitle}</p>
      <div className="grid grid-cols-3 gap-2">
        <TierCard label={t.aboutTierAnonymous} count={1} unit={votesUnit(t, 1)} tone="muted" active={activeTier === 'muted'} />
        <TierCard
          label={t.aboutTierRegistered}
          count={3}
          unit={votesUnit(t, 3)}
          promo={t.aboutTierRegisteredPromo}
          tone="accent"
          active={activeTier === 'accent'}
          onClick={onRegisteredClick}
        />
        <div className="relative">
          <TierCard
            label={t.aboutTierSupporter}
            count={5}
            unit={votesUnit(t, 5)}
            promo={t.aboutTierSupporterPromo}
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
