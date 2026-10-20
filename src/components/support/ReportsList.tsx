import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { RoleBadge } from '../common/RoleBadge';
import { FlagImg } from '../common/CountryFlag';
import { useReports, useValidateReport } from '../../hooks/useReports';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short',
  });
}

// Admin triage of reported opinios, grouped by profile. Review, open, or mark
// validated to dismiss permanently. No auto-action.
export function ReportsList({
  onClose, t,
}: {
  onClose: () => void;
  t: ReturnType<typeof useI18n>['t'];
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: reports = [], isLoading } = useReports();
  const { mutate: validate, isPending, variables: validatingId } = useValidateReport();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <p className="px-6 py-8 text-sm text-white/50 text-center">{t.loading}</p>;

  if (reports.length === 0) {
    return (
      <div className="px-6 py-10 flex flex-col items-center gap-3 text-white/50">
        <span className="text-4xl">🚩</span>
        <p className="text-sm">{t.reportsNone}</p>
      </div>
    );
  }

  const openProfile = (id: string) => {
    onClose();
    navigate(`/p/${id}${location.search}`);
  };

  return (
    <div className="px-6 py-5 flex flex-col gap-3">
      {reports.map((g) => {
        const shown = expanded === g.profileId ? g.reports : g.reports.slice(0, 2);
        return (
          <div key={g.profileId} className="rounded-xl border border-border">
            <div className="flex items-start justify-between gap-2 px-4 py-3">
              <button
                onClick={() => openProfile(g.profileId)}
                className="flex items-center gap-2 min-w-0 text-left group"
              >
                {g.profileCountry && <FlagImg code={g.profileCountry} className="inline-block align-middle shrink-0" />}
                <span className="text-sm text-white font-medium truncate group-hover:underline">{g.profileName}</span>
                <RoleBadge role={g.role} />
              </button>
              <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {t.reportsCount.replace('{count}', String(g.reportCount))}
              </span>
            </div>
            <div className="px-4 pb-3 flex flex-col gap-2">
              {shown.map((r, i) => (
                <div key={i} className="rounded-lg bg-white/[0.03] border border-border px-3 py-2">
                  <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{r.reason}</p>
                  <p className="text-xs text-white/50 mt-1">
                    {r.reporterName ? `@${r.reporterName}` : t.reportAnonymous}
                    {r.reporterTier ? ` · ${r.reporterTier}` : ''} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
              ))}
              <div className="flex items-center justify-between gap-2">
                {g.reports.length > 2 ? (
                  <button
                    onClick={() => setExpanded(expanded === g.profileId ? null : g.profileId)}
                    className="text-xs text-white/50 hover:text-white/70 transition-colors"
                  >
                    {expanded === g.profileId ? '−' : `+${g.reports.length - 2}`}
                  </button>
                ) : <span />}
                <button
                  onClick={() => validate(g.profileId)}
                  disabled={isPending && validatingId === g.profileId}
                  className="text-xs px-3 py-1 rounded-lg bg-positive/20 text-positive border border-positive/30 hover:bg-positive/30 disabled:opacity-50 transition-colors"
                >
                  {isPending && validatingId === g.profileId ? t.reportValidating : t.reportMarkValidated}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
