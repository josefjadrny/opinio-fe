import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModalShell } from '../common/ModalShell';
import { addNewProfile, uploadImage, uploadContentImage } from '../../api/client';
import { ALL_COUNTRIES } from '../../utils/countries';
import { FlagImg } from '../common/CountryFlag';
import { ALL_ROLES, ROLE_COLORS } from '../../utils/roles';
import { useI18n } from '../../i18n/I18nContext';
import { useMe } from '../../hooks/useMe';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSignIn } from '../auth/SignInContext';
import { resizeImage } from '../../utils/resizeImage';
import { Avatar } from '../profile/Avatar';
import { RoleBadge } from '../common/RoleBadge';
import { LabelBadge } from '../profile/LabelBadge';
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

// Form palette — matches SettingsModal so the two modals read as one family
// (label = text-xs font-medium /80; hint = text-xs /30). No uppercase micro-
// labels, which made this modal look off next to the rest of the app.
const LABEL = 'block text-xs font-medium text-white/80 mb-1.5';
const INPUT =
  'w-full bg-surface text-white text-sm rounded-lg border border-border px-3 py-2 placeholder:text-white/30 focus:outline-none focus:border-accent transition-colors';
const HINT = 'text-xs text-white/30 mt-1.5 leading-snug';
const COUNTER = 'text-xs text-white/30 mt-1 text-right tabular-nums';
const ERROR = 'text-xs text-red-400 mt-1';

// Link is stored as plain text for the MVP (no OG fetch / preview card yet).
// We only sanity-check it's an http(s) URL and cap it so the BE contract is
// simple (single optional string, <= 255 chars).
const MAX_LINK_LENGTH = 255;

function isValidLink(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// "https://www.example.com/path?x=1" -> "example.com" for the compact chip.
function linkHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return value;
  }
}

const LinkIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

// Static, non-interactive twin of the opinio card so the author sees the result
// of every field as they type. Mirrors the detail-modal layout (header + body +
// content image + link chip + read-only vote row). Not the real ProfileCard,
// which is wired into navigation/hover/voting and needs a full Profile object.
interface PreviewCardProps {
  name: string;
  role: Role;
  countryCode: string;
  description: string;
  avatarUrl: string | null;
  contentImageUrl: string | null;
  link: string;
  // Votes row is dropped on mobile (the pinned preview must stay compact).
  showVotes?: boolean;
}

function OpinioPreviewCard({ name, role, countryCode, description, avatarUrl, contentImageUrl, link, showVotes = true }: PreviewCardProps) {
  const { t } = useI18n();
  const hasLink = link.trim().length > 0;
  return (
    <div className="rounded-xl border border-border bg-surface-light/50 overflow-hidden">
      {/* Name + badges share one wrapping row (mirrors ProfileCard) so there's
          no dead gap between the headline and the flag/category/NEW row. */}
      <div className="flex items-start gap-2.5 px-3 pt-3">
        {avatarUrl ? (
          <Avatar name={name || '?'} imageUrl={avatarUrl} className="w-9 h-9 shrink-0" />
        ) : (
          // Neutral placeholder so the avatar doesn't reshuffle its hashed color
          // on every keystroke — the color is meaningless in the preview.
          <div className="w-9 h-9 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-sm font-semibold">
            {(name.trim()[0] || '?').toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1 flex items-center gap-x-1.5 gap-y-0.5 flex-wrap">
          <span className={`text-sm font-semibold truncate min-w-0 flex-shrink ${name ? 'text-white' : 'text-white/30'}`}>
            {name || t.previewHeadlinePlaceholder}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <FlagImg code={countryCode} />
            <RoleBadge role={role} />
            <LabelBadge label="new" />
          </div>
        </div>
      </div>
      <p className={`px-3 mt-2 text-[13px] leading-relaxed break-words ${description ? 'text-white/80' : 'text-white/30'}`}>
        {description || t.descriptionLabel}
      </p>
      {contentImageUrl && (
        <img src={contentImageUrl} alt="" className="mt-2 w-full max-h-32 object-contain bg-black/30" />
      )}
      {hasLink && (
        <div className="px-3 mt-2">
          <span className="inline-flex items-center gap-1 max-w-full text-[11px] text-accent/90 bg-accent/10 rounded-full px-2 py-0.5">
            <LinkIcon className="w-3 h-3 shrink-0" />
            <span className="truncate">{linkHost(link)}</span>
          </span>
        </div>
      )}
      {showVotes && (
        <div className="flex items-center gap-4 px-3 py-2.5 mt-2 border-t border-border text-xs font-semibold tabular-nums">
          <span className="inline-flex items-baseline gap-1 text-positive"><span className="text-[10px]">▲</span>0</span>
          <span className="inline-flex items-baseline gap-1 text-negative"><span className="text-[10px]">▼</span>0</span>
        </div>
      )}
      {!showVotes && <div className="pb-3" />}
    </div>
  );
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
  const isMobile = useIsMobile();
  const { promptSignIn } = useSignIn();

  // Clipboard read is gated behind a secure context + browser support; only
  // show the Paste affordance where it actually works.
  const canPaste = typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;

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
  const [link, setLink] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
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

  const handlePasteLink = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text) {
        setLink(text.slice(0, MAX_LINK_LENGTH));
        setLinkError(null);
      }
    } catch {
      // Permission denied / unavailable — silently no-op; the user can still type.
    }
  };

  const mutation = useMutation({
    mutationFn: async (fields: { name: string; role: Role; countryCode: string; description: string; link?: string }) => {
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
        link: fields.link,
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
    const trimmedLink = link.trim();
    if (trimmedLink && !isValidLink(trimmedLink)) {
      setLinkError(t.linkInvalid);
      setLinkOpen(true);
      return;
    }
    mutation.mutate({
      name: name.trim(),
      role,
      countryCode,
      description: description.trim(),
      link: trimmedLink || undefined,
    });
  };

  return (
    <ModalShell
      onClose={onClose}
      title={t.addProfileTitle}
      icon={<NominateIcon />}
      maxWidth="max-w-3xl"
      desktopScrollable
    >
      <div className="md:flex md:items-stretch">
      {isMobile && (
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3">
          {/* "Live preview" tag overlays the card's top-right corner (absolute,
              out of flow) so the cue costs zero height and zero width. */}
          <div className="relative">
            <span className="absolute -top-2 right-3 z-10 text-[10px] font-medium uppercase tracking-wide text-white/50 bg-surface border border-border rounded-full px-2 py-0.5 pointer-events-none">
              {t.previewCaption}
            </span>
            <OpinioPreviewCard
              name={name}
              role={role}
              countryCode={countryCode}
              description={description}
              avatarUrl={previewUrl}
              contentImageUrl={contentPreviewUrl}
              link={link}
              showVotes={false}
            />
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 md:flex-1 md:min-w-0">
        {/* Statement — avatar picker sits inline to the left, so the opinio's
            face and headline read as one unit and we drop a whole labeled row. */}
        <div>
          <label className={LABEL}>{t.statementLabel}</label>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-11 h-11 rounded-full border border-border bg-surface shrink-0 overflow-hidden group hover:border-white/25 transition-colors"
              title={previewUrl ? t.photoChange : t.photoChoose}
              aria-label={previewUrl ? t.photoChange : t.photoChoose}
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </span>
                </>
              ) : (
                <span className="w-full h-full flex items-center justify-center text-white/50 group-hover:text-white/80 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M21 3.75H3A.75.75 0 002.25 4.5v15a.75.75 0 00.75.75h18a.75.75 0 00.75-.75v-15A.75.75 0 0021 3.75z" />
                  </svg>
                </span>
              )}
              {previewUrl && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setImageBlob(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setImageBlob(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; } }}
                  aria-label={t.photoRemove}
                  className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-surface border border-border rounded-full text-white/60 hover:text-white hover:border-white/40 transition-colors"
                >
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              )}
            </button>
            <input
              type="text"
              placeholder={t.statementPlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              maxLength={40}
              className={`${INPUT} flex-1 min-w-0`}
              required
            />
          </div>
          <div className="flex items-start justify-between gap-3 mt-1.5">
            <p className="text-xs text-white/30 leading-snug">{t.statementHint}</p>
            <p className={`text-xs text-white/30 tabular-nums shrink-0 ${name.length >= 36 ? 'text-red-400' : ''}`}>
              {name.length} / 40
            </p>
          </div>
          {imageError && <p className={ERROR}>{imageError}</p>}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Category */}
        <div>
          <label className={LABEL}>{t.categoryLabel}</label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`${ROLE_COLORS[r]} text-white text-[11px] leading-none font-semibold px-2 py-1 rounded-full uppercase tracking-wide transition-all ${
                  role === r ? 'opacity-100 ring-2 ring-white/40' : 'opacity-40 hover:opacity-70'
                }`}
              >
                {t.roles[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Country */}
        <div>
          <label className={LABEL}>{t.profileCountry}</label>
          <div ref={countryFieldRef} className="relative">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FlagImg code={countryCode} />
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
                className={`${INPUT} pl-9 pr-10`}
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
                aria-label="Toggle country list"
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
                      <FlagImg code={c.code} className="mr-2 inline-block align-middle shrink-0" />
                      {c.name}
                      <span className="ml-2 text-white/40">{c.code}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-white/40">No country found</div>
                )}
              </div>
            )}
          </div>
          <p className={HINT}>{t.profileCountryHint}</p>
        </div>

        {/* Description */}
        <div>
          <label className={LABEL}>{t.descriptionLabel}</label>
          <textarea
            placeholder={t.descriptionPlaceholder}
            value={description}
            maxLength={255}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`${INPUT} resize-none`}
            required
          />
          <p className={`${COUNTER} ${description.length >= 230 ? 'text-red-400' : ''}`}>
            {description.length} / 255
          </p>
        </div>

        {/* Attachments — image + link grouped with tight (8px) spacing so the
            two "Add ..." affordances sit together, not a full field-gap apart. */}
        <div className="space-y-2">
        {/* Optional image — collapsed to a single text affordance by default so
            the form reads as four core fields. Clicking opens the picker; once a
            file is chosen we show a compact preview with change / remove. */}
        <div>
          {contentPreviewUrl ? (
            <div className="relative group rounded-lg overflow-hidden border border-border bg-black/30">
              <img src={contentPreviewUrl} alt="" className="w-full h-auto max-h-44 object-contain" />
              <button
                type="button"
                onClick={() => contentFileInputRef.current?.click()}
                className="absolute bottom-2 left-2 px-2.5 py-1 text-[11px] font-medium bg-black/60 hover:bg-black/80 text-white rounded-md backdrop-blur-sm transition-opacity md:opacity-0 group-hover:opacity-100"
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
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-opacity md:opacity-0 group-hover:opacity-100"
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
              className="flex w-fit items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M21 3.75H3A.75.75 0 002.25 4.5v15a.75.75 0 00.75.75h18a.75.75 0 00.75-.75v-15A.75.75 0 0021 3.75z" />
              </svg>
              {t.contentImageAdd}
            </button>
          )}
          {contentImageError && <p className={ERROR}>{contentImageError}</p>}
          <input ref={contentFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleContentFileChange} />
        </div>

        {/* Optional link — one URL, plain text for now (no OG/preview in MVP).
            Same collapsed-affordance pattern as the content image; sits next to
            it so future attachment types (e.g. video) slot in here too. */}
        <div>
          {linkOpen || link ? (
            <div>
              <label className={LABEL}>{t.linkLabel}</label>
              <div className="flex gap-2">
                <input
                  ref={linkInputRef}
                  type="url"
                  inputMode="url"
                  placeholder={t.linkPlaceholder}
                  value={link}
                  onChange={(e) => { setLink(e.target.value.slice(0, MAX_LINK_LENGTH)); setLinkError(null); }}
                  maxLength={MAX_LINK_LENGTH}
                  className={`${INPUT} flex-1 min-w-0`}
                />
                {canPaste && (
                  <button
                    type="button"
                    onClick={handlePasteLink}
                    className="shrink-0 px-3 rounded-lg border border-border text-xs font-medium text-white/70 hover:text-white hover:border-white/25 transition-colors"
                  >
                    {t.linkPaste}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setLink(''); setLinkError(null); setLinkOpen(false); }}
                  aria-label={t.linkRemove}
                  className="shrink-0 px-2 text-white/40 hover:text-white/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {linkError && <p className={ERROR}>{linkError}</p>}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setLinkOpen(true); requestAnimationFrame(() => linkInputRef.current?.focus()); }}
              className="flex w-fit items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
            >
              <LinkIcon />
              {t.linkAdd}
            </button>
          )}
        </div>
        </div>

        {isAnonymous ? (
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-white/70">{t.nominateTooltip}</p>
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
              <p className="text-sm text-white/70 mt-0.5">{t.blockedBody}</p>
              <p className="text-[11px] text-white/55 mt-2">
                <span className="text-white/40">{t.blockedUntilLabel}:</span>{' '}
                <span className="text-white/80 font-medium">
                  {blockedUntilDate!.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </p>
              <p className="text-[11px] text-white/40 mt-1.5">
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
            // Brand --color-positive (#22c55e), dimmed via /80 so a full-width
            // bar of it isn't retina-burning against the dark surface. Same
            // hue as vote arrows / liking accents — one green app-wide.
            className="w-full bg-positive/80 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-positive transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? t.adding : t.dropButton}
          </button>
        )}
      </form>
      {!isMobile && (
        <aside className="md:flex md:flex-col md:w-72 md:shrink-0 border-l border-border bg-black/20 px-5 py-4">
          <div className="sticky top-4">
            {/* Same corner tag as mobile - overlays the card's top-right corner. */}
            <div className="relative">
              <span className="absolute -top-2 right-3 z-10 text-[10px] font-medium uppercase tracking-wide text-white/50 bg-surface border border-border rounded-full px-2 py-0.5 pointer-events-none">
                {t.previewCaption}
              </span>
              <OpinioPreviewCard
                name={name}
                role={role}
                countryCode={countryCode}
                description={description}
                avatarUrl={previewUrl}
                contentImageUrl={contentPreviewUrl}
                link={link}
              />
            </div>
            <p className="text-xs text-white/30 mt-2">{t.votesExpireNote}</p>
          </div>
        </aside>
      )}
      </div>
    </ModalShell>
  );
}
