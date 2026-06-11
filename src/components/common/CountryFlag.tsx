import { getCountryFlag, getCountryName } from '../../utils/countries';

export function CountryFlag({ code, showName = false, flagClassName = 'text-lg' }: { code: string; showName?: boolean; flagClassName?: string }) {
  return (
    <span className="inline-flex items-center gap-1" title={getCountryName(code)}>
      <span className={flagClassName}>{getCountryFlag(code)}</span>
      {showName && <span className="text-xs text-text-secondary">{getCountryName(code)}</span>}
    </span>
  );
}
