import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModalShell } from '../common/ModalShell';
import { addNewProfile, uploadImage, uploadContentImage } from '../../api/client';
import { ALL_COUNTRIES, getCountryFlag } from '../../utils/countries';
import { ALL_ROLES, ROLE_COLORS } from '../../utils/roles';
import { useI18n } from '../../i18n/I18nContext';
import { useMe } from '../../hooks/useMe';
import { useSignIn } from '../auth/SignInContext';
import { resizeImage } from '../../utils/resizeImage';
import type { Role } from '../../types/profile';

function getDefaultCountryCode() {
  const locale = navigator.language || 'en-US';
  const region = locale.split('-')[1]?.toUpperCase();
  if (region && ALL_COUNTRIES.some((c) => c.code === region)) return region;
  return 'US';
}

function getCountryOptionLabel(code: string) {
  const country = ALL_COUNTRIES.find((c) => c.code === code);
  return country ? `${country.name} (${code})` : code;
}

function findCountry(value: string) {
  const normalized = value.trim().toLowerCase();
  return ALL_COUNTRIES.find((country) => {
    const optionLabel = `${country.name} (${country.code})`.toLowerCase();
    return country.code.toLowerCase() === normalized
      || country.name.toLowerCase() === normalized
      || optionLabel === normalized;
  });
}

const NominateIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path stroke="var(--color-negative)" strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
    <path stroke="var(--color-positive)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v6M9 12h6" />
  </svg>
);

interface AddProfileModalProps {
  onClose: () => void;
}

function renderTokens(text: string, tokens: Record<string, ReactNode>) {
  const parts = text.split(/(\{[a-z]+\})/g);
  return parts.map((part, i) => {
    const m = part.match(/^\{([a-z]+)\}$/);
    if (m && tokens[m[1]] !== undefined) return <span key={i}>{tokens[m[1]]}</span>;
    return <span key={i}>{part}</span>;
  });
}

export function AddProfileModal({ onClose }: AddProfileModalProps) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { data: me } = useMe();
  const navigate = useNavigate();
  const location = useLocation();
  const { promptSignIn } = useSignIn();

  const user = me?.user;
  const isAnonymous = !user || user.tier === 'anonymous';
  const blockedUntilDate = user?.blockedUntil ? new Date(user.blockedUntil) : null;
  const isBlocked = !!blockedUntilDate && blockedUntilDate.getTime() > Date.now();

  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('politics');
  const [countryCode, setCountryCode] = useState(getDefaultCountryCode);
  const [countryInput, setCountryInput] = useState(() => getCountryOptionLabel(getDefaultCountryCode()));
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [contentImageFile, setContentImageFile] = useState<File | null>(null);
  const [contentPreviewUrl, setContentPreviewUrl] = useState<string | null>(null);
  const [contentImageError, setContentImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);
  const countryFieldRef = useRef<HTMLDivElement>(null);

  const filteredCountries = ALL_COUNTRIES.filter((country) => {
    const query = countryInput.trim().toLowerCase();
    if (!query) return true;
    return country.name.toLowerCase().includes(query) || country.code.toLowerCase().includes(query);
  });

  const countryInitialized = useRef(false);
  useEffect(() => {
    if (!countryInitialized.current && user?.countryCode) {
      if (ALL_COUNTRIES.some((c) => c.code === user.countryCode)) {
        setCountryCode(user.countryCode!);
        setCountryInput(getCountryOptionLabel(user.countryCode!));
      }
      countryInitialized.current = true;
    }
  }, [user?.countryCode]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!countryFieldRef.current?.contains(e.target as Node)) {
        setCountryMenuOpen(false);
        setCountryInput(getCountryOptionLabel(countryCode));
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [countryCode]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    return () => { if (contentPreviewUrl) URL.revokeObjectURL(contentPreviewUrl); };
  }, [contentPreviewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    if (!file.type.startsWith('image/')) { setImageError('Please select an image file'); return; }
    try {
      const blob = await resizeImage(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setImageBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setImageError('Failed to process image');
    }
  };

  // Content image: server handles all resizing + moderation. We just preview
  // the raw file locally and ship it on submit. Accepted: JPEG / PNG / WebP up to 10 MB.
  const ACCEPTED_CONTENT_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_CONTENT_UPLOAD_BYTES = 10 * 1024 * 1024;
  const handleContentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setContentImageError(null);
    if (!ACCEPTED_CONTENT_MIMES.includes(file.type)) {
      setContentImageError('JPEG, PNG or WebP only');
      return;
    }
    if (file.size > MAX_CONTENT_UPLOAD_BYTES) {
      setContentImageError('Image must be under 10 MB');
      return;
    }
    if (contentPreviewUrl) URL.revokeObjectURL(contentPreviewUrl);
    setContentImageFile(file);
    setContentPreviewUrl(URL.createObjectURL(file));
  };

  const mutation = useMutation({
    mutationFn: async (fields: { name: string; role: Role; countryCode: string; description: string }) => {
      let finalImageUrl = '';
      let finalImageKey: string | undefined;
      if (imageBlob) {
        const { url, key } = await uploadImage(imageBlob);
        finalImageUrl = url;
        finalImageKey = key;
      }
      let finalContentImageUrl: string | undefined;
      let finalContentImageKey: string | undefined;
      if (contentImageFile) {
        try {
          const { url, key } = await uploadContentImage(contentImageFile);
          finalContentImageUrl = url;
          finalContentImageKey = key;
        } catch (err) {
          // Surface the friendly inline error rather than blowing up the whole
          // mutation — the avatar upload (if any) already succeeded.
          const status = (err as { status?: number } | null)?.status;
          setContentImageError(status === 422 ? t.contentImageBlocked : t.contentImageUploadError);
          throw err;
        }
      }
      return addNewProfile({
        ...fields,
        imageUrl: finalImageUrl,
        imageKey: finalImageKey,
        contentImageUrl: finalContentImageUrl,
        contentImageKey: finalContentImageKey,
        addedBy: user?.displayName ?? 'Anonymous',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    if (isBlocked) return;
    mutation.mutate({ name: name.trim(), role, countryCode, description: description.trim() });
  };

  return (
    <ModalShell
      onClose={onClose}
      title={t.addProfileTitle}
      icon={<NominateIcon />}
      maxWidth="max-w-md"
      desktopScrollable
    >
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">{t.statementLabel}</label>
          <input
            type="text"
            placeholder={t.statementPlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            maxLength={40}
            className="w-full bg-surface text-white text-sm rounded-lg border border-border px-3 py-2 focus:outline-none focus:border-accent"
            required
          />
          <p className={`text-xs mt-1 text-right ${name.length >= 36 ? 'text-red-400' : 'text-white/25'}`}>
            {name.length} / 40
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">{t.photoLabel}</label>
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full border border-border bg-surface shrink-0 overflow-hidden cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M21 3.75H3A.75.75 0 002.25 4.5v15a.75.75 0 00.75.75h18a.75.75 0 00.75-.75v-15A.75.75 0 0021 3.75z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-white/60 hover:text-white transition-colors">
                {previewUrl ? t.photoChange : t.photoChoose}
              </button>
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => { setImageBlob(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="block text-xs text-white/30 hover:text-white/60 transition-colors mt-0.5"
                >
                  {t.photoRemove}
                </button>
              )}
              {imageError && <p className="text-xs text-red-400 mt-0.5">{imageError}</p>}
              <p className="text-xs text-white/25 mt-0.5">{t.photoHint}</p>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">{t.categoryLabel}</label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`${ROLE_COLORS[r]} text-white text-[11px] leading-none font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide transition-all ${
                  role === r ? 'opacity-100 ring-2 ring-white/40' : 'opacity-35 hover:opacity-65'
                }`}
              >
                {t.roles[r]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">{t.profileCountry}</label>
          <div ref={countryFieldRef} className="relative">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-base leading-none pointer-events-none">
                {getCountryFlag(countryCode)}
              </span>
              <input
                type="text"
                value={countryInput}
                onFocus={() => { setCountryMenuOpen(true); setCountryInput(''); }}
                onChange={(e) => { setCountryInput(e.target.value); setCountryMenuOpen(true); }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setCountryMenuOpen(false); setCountryInput(getCountryOptionLabel(countryCode)); }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const match = findCountry(countryInput) ?? filteredCountries[0];
                    if (match) { setCountryCode(match.code); setCountryInput(getCountryOptionLabel(match.code)); setCountryMenuOpen(false); }
                  }
                }}
                autoComplete="off"
                className="w-full text-white text-sm rounded-lg border border-border pl-11 pr-10 py-2 focus:outline-none focus:border-accent"
                placeholder={t.profileCountry}
                style={{ backgroundColor: '#1a1a2e' }}
              />
              <button
                type="button"
                onClick={() => {
                  setCountryMenuOpen((open) => {
                    const next = !open;
                    if (next) setCountryInput('');
                    else setCountryInput(getCountryOptionLabel(countryCode));
                    return next;
                  });
                }}
                className="absolute inset-y-0 right-0 px-3 text-white/40 hover:text-white/70 transition-colors"
              >
                <svg className={`w-4 h-4 transition-transform ${countryMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            {countryMenuOpen && (
              <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-border bg-surface shadow-xl">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => { setCountryCode(c.code); setCountryInput(getCountryOptionLabel(c.code)); setCountryMenuOpen(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="mr-2">{getCountryFlag(c.code)}</span>
                      {c.name}
                      <span className="ml-2 text-white/35">{c.code}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-white/40">No country found</div>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-white/35 mt-1.5 leading-snug">{t.profileCountryHint}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">{t.descriptionLabel}</label>
          <textarea
            placeholder={t.descriptionPlaceholder}
            value={description}
            maxLength={255}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-surface text-white text-sm rounded-lg border border-border px-3 py-2 focus:outline-none focus:border-accent resize-none"
            required
          />
          <p className={`text-xs mt-1 text-right ${description.length >= 230 ? 'text-red-400' : 'text-white/25'}`}>
            {description.length} / 255
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">{t.contentImageLabel}</label>
          {contentPreviewUrl ? (
            <div className="relative group rounded-lg overflow-hidden border border-border bg-black/30" style={{ aspectRatio: '16 / 9' }}>
              <img src={contentPreviewUrl} alt="" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={() => contentFileInputRef.current?.click()}
                className="absolute bottom-2 left-2 px-2.5 py-1 text-[11px] font-medium bg-black/60 hover:bg-black/80 text-white/90 rounded-md backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100"
              >
                {t.contentImageChange}
              </button>
              <button
                type="button"
                onClick={() => {
                  setContentImageFile(null);
                  if (contentPreviewUrl) URL.revokeObjectURL(contentPreviewUrl);
                  setContentPreviewUrl(null);
                  setContentImageError(null);
                  if (contentFileInputRef.current) contentFileInputRef.current.value = '';
                }}
                aria-label={t.contentImageRemove}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white/90 rounded-full backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => contentFileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-1.5 py-6 border border-dashed border-border rounded-lg text-white/40 hover:text-white/70 hover:border-white/25 hover:bg-white/[0.02] transition-colors"
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm">{t.contentImageChoose}</span>
              <span className="text-[11px] text-white/30">{t.contentImageHint}</span>
            </button>
          )}
          {contentImageError && <p className="text-xs text-red-400 mt-1.5">{contentImageError}</p>}
          <input ref={contentFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleContentFileChange} />
        </div>

        {isAnonymous ? (
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-white/60">{t.nominateTooltip}</p>
            <button type="button" onClick={promptSignIn} className="shrink-0 text-sm font-medium text-accent hover:text-accent/80 transition-colors">
              {t.login}
            </button>
          </div>
        ) : isBlocked ? (
          <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
              <path stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" d="M2.697 16.126c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75M12 15.75h.008v.008H12v-.008z" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{t.blockedTitle}</p>
              <p className="text-sm text-white/60 mt-0.5">{t.blockedBody}</p>
              <p className="text-xs text-white/50 mt-2">
                <span className="text-white/40">{t.blockedUntilLabel}:</span>{' '}
                <span className="text-white/80 font-medium">
                  {blockedUntilDate!.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </p>
              <p className="text-xs text-white/40 mt-1.5">
                {renderTokens(t.blockedFooterNote, {
                  support: (
                    <button
                      type="button"
                      onClick={() => navigate('/support' + location.search)}
                      className="text-accent hover:text-accent/80 transition-colors"
                    >
                      {t.blockedFooterNoteSupportLabel}
                    </button>
                  ),
                })}
              </p>
            </div>
          </div>
        ) : (
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-positive/80 text-white text-sm font-medium py-2 rounded-lg hover:bg-positive transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? t.adding : t.dropButton}
          </button>
        )}
      </form>
    </ModalShell>
  );
}
