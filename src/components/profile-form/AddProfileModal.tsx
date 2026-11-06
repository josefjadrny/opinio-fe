import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModalShell } from '../common/ModalShell';
import { HoverTip } from '../common/HoverTip';
import { addNewProfile, uploadContentImage, uploadOptionImage } from '../../api/client';
import { clearDraftImages, loadDraftImages, saveDraftImages } from '../../utils/draftImages';
import { ALL_ROLES, ROLE_COLORS } from '../../utils/roles';
import { useI18n } from '../../i18n/I18nContext';
import { plural } from '../../i18n/pollStrings';
import { useMe } from '../../hooks/useMe';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSignIn } from '../auth/SignInContext';
import { RoleBadge } from '../common/RoleBadge';
import { PollThumb } from '../poll/PollThumb';
import type { Role } from '../../types/profile';
import { stripEmoji } from '../../utils/emoji';
import { nextFreeColor, OPTION_COLORS } from '../../utils/pollColors';
import { OptionAvatar } from '../poll/OptionAvatar';
import { OptionColorPicker } from '../poll/OptionColorPicker';
import { NewPollIcon } from '../poll/PollIcons';
import { POLL_BODY_MAX, POLL_OPTION_MAX, POLL_OPTIONS_MAX, POLL_OPTIONS_MIN, POLL_TITLE_MAX } from '../../utils/polls';
import { EmojiPickerPopover } from '../common/EmojiPickerPopover';

// One answer in the form. The picture stays a local File until submit, like
// the poll's image.
interface FormOption { text: string; color: string; file: File | null; preview: string | null }
const blankOption = (used: string[]): FormOption => ({ text: '', color: nextFreeColor(used), file: null, preview: null });
// A new poll starts with two answers in the brand red and green.
const startOptions = (): FormOption[] => [blankOption([]), blankOption([OPTION_COLORS[0]])];

// Draft persisted so a half-composed poll survives closing the modal (or a
// reload): the text in localStorage, the pictures (the poll's and the
// answers', raw uploads up to 10MB - past localStorage's ~5MB) in IndexedDB,
// see utils/draftImages.
const DRAFT_KEY = 'opinio:add-poll-draft';
// Drafts older than this are dropped on load.
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

interface PollDraft {
  name: string;
  role: Role;
  description: string;
  options: { text: string; color: string }[];
  link: string;
  /** Pictures were chosen; they live in IndexedDB (utils/draftImages). */
  images?: boolean;
  savedAt: number;
}

function loadDraft(): PollDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<PollDraft>;
    if (typeof d.savedAt !== 'number' || Date.now() - d.savedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    const name = typeof d.name === 'string' ? d.name : '';
    const description = typeof d.description === 'string' ? d.description : '';
    const link = typeof d.link === 'string' ? d.link : '';
    const options: { text: string; color: string }[] = [];
    for (const o of Array.isArray(d.options) ? d.options.slice(0, POLL_OPTIONS_MAX) : []) {
      const raw = o as unknown;
      const text = typeof raw === 'string' ? raw : typeof (raw as { text?: unknown })?.text === 'string' ? (raw as { text: string }).text : '';
      const c = (raw as { color?: unknown })?.color;
      const used = options.map((x) => x.color);
      options.push({ text, color: typeof c === 'string' && (OPTION_COLORS as readonly string[]).includes(c) && !used.includes(c) ? c : nextFreeColor(used) });
    }
    while (options.length < POLL_OPTIONS_MIN) options.push({ text: '', color: nextFreeColor(options.map((x) => x.color)) });
    const images = d.images === true;
    if (!name.trim() && !description.trim() && !link.trim() && !options.some((o) => o.text.trim()) && !images) return null;
    return { name, description, link, options, images, savedAt: d.savedAt, role: ALL_ROLES.includes(d.role as Role) ? (d.role as Role) : 'politics' };
  } catch {
    return null;
  }
}

const LABEL = 'block text-xs font-medium text-white/80 mb-1.5';
const INPUT =
  'w-full bg-surface text-white text-sm rounded-lg border border-border px-3 py-2 placeholder:text-white/50 focus:outline-none focus:border-accent transition-colors';
const COUNTER = 'text-xs text-white/50 mt-1 text-right tabular-nums';
const ERROR = 'text-xs text-red-400 mt-1';

const MAX_LINK_LENGTH = 255;

function isValidLink(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

const LinkIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

// The poll as the author will see it: the list card (question only, 3-line
// clamp, meta line) and under it the answers as they appear on the poll page.
function PollPreview({ name, role, options, thumbUrl }: { name: string; role: Role; options: FormOption[]; thumbUrl: string | null }) {
  const { t, p, locale } = useI18n();
  const shown = options.filter((o) => o.text.trim());
  const withPictures = shown.some((o) => o.preview);
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-xl bg-surface-light/40 ring-1 ring-white/[0.06] px-3 py-2.5">
        <PollThumb role={role} imageUrl={thumbUrl} className="w-10 h-10" />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold leading-snug line-clamp-3 break-words text-[15px] ${name ? 'text-white' : 'text-white/50'}`}>
            {name || p.questionPlaceholder}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <RoleBadge role={role} />
            <span className="text-[13px] text-text-secondary">{plural(p.votes, locale, 0)}</span>
          </div>
        </div>
      </div>
      {shown.length > 0 && (
        <div className="space-y-1.5" aria-label={t.previewCaption}>
          {shown.map((o, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-xl ring-1 ring-white/10 px-3 py-2">
              {withPictures
                ? <OptionAvatar color={o.color} imageUrl={o.preview} className="w-10 h-10" />
                : <span className="w-3 h-3 rounded-full shrink-0" style={{ background: o.color }} />}
              <span className="flex-1 min-w-0 text-sm text-white truncate">{o.text.trim()}</span>
              <span className="text-sm font-semibold tabular-nums text-white/50">0%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const { t, p } = useI18n();
  const { data: me } = useMe();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { promptSignIn } = useSignIn();
  // "Ask the world about this" from a news story carries the story along.
  const fromNews = location.state as { newsId?: string; newsTitle?: string } | null;
  const newsId = fromNews?.newsId ?? null;

  const canPaste = typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;

  const user = me?.user;
  const isAnonymous = !user || user.tier === 'anonymous';
  const blockedUntilDate = user?.blockedUntil ? new Date(user.blockedUntil) : null;
  const [mountedAt] = useState(() => Date.now());
  const isBlocked = !!blockedUntilDate && blockedUntilDate.getTime() > mountedAt;

  const [restoredDraft, setRestoredDraft] = useState(() => (newsId ? null : loadDraft()));
  const [name, setName] = useState(() => restoredDraft?.name ?? '');
  const [role, setRole] = useState<Role>(() => restoredDraft?.role ?? 'politics');
  const [options, setOptions] = useState<FormOption[]>(() => restoredDraft?.options.map((o) => ({ ...o, file: null, preview: null })) ?? startOptions());
  const [optionImageError, setOptionImageError] = useState<string | null>(null);
  const optionFileRef = useRef<HTMLInputElement>(null);
  const optionFileIndex = useRef(0);
  const [description, setDescription] = useState(() => restoredDraft?.description ?? '');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const emojiWrapRef = useRef<HTMLDivElement>(null);
  const [contentImageFile, setContentImageFile] = useState<File | null>(null);
  const [contentPreviewUrl, setContentPreviewUrl] = useState<string | null>(null);
  const [contentImageError, setContentImageError] = useState<string | null>(null);
  const [link, setLink] = useState(() => restoredDraft?.link ?? '');
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (contentPreviewUrl) URL.revokeObjectURL(contentPreviewUrl); };
  }, [contentPreviewUrl]);

  // Close the emoji popover on an outside click or Escape (capture phase, so
  // Escape does not also close the modal).
  useEffect(() => {
    if (!emojiOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!emojiWrapRef.current?.contains(e.target as Node)) setEmojiOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); setEmojiOpen(false); }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [emojiOpen]);

  const insertEmoji = (emoji: string) => {
    const ta = descriptionRef.current;
    const start = ta?.selectionStart ?? description.length;
    const end = ta?.selectionEnd ?? description.length;
    const next = description.slice(0, start) + emoji + description.slice(end);
    if (next.length > POLL_BODY_MAX) return;
    setDescription(next);
    requestAnimationFrame(() => {
      if (!ta) return;
      const pos = start + emoji.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  // The draft's pictures come back from IndexedDB a moment after the form
  // opens; until then the save below must not overwrite them with "none".
  const [imagesReady, setImagesReady] = useState(() => !restoredDraft?.images);
  useEffect(() => {
    if (imagesReady) {
      // Nothing to restore: drop pictures left by an expired or empty draft.
      if (!restoredDraft && !newsId) void clearDraftImages();
      return;
    }
    let live = true;
    loadDraftImages().then((saved) => {
      if (!live) return;
      if (saved?.main) {
        setContentImageFile(saved.main);
        setContentPreviewUrl(URL.createObjectURL(saved.main));
      }
      if (saved) {
        setOptions((prev) => prev.map((o, i) => {
          const file = saved.options[i];
          return file ? { ...o, file, preview: URL.createObjectURL(file) } : o;
        }));
      }
      setImagesReady(true);
    });
    return () => { live = false; };
    // Once, on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasImages = !!contentImageFile || options.some((o) => o.file);
  useEffect(() => {
    if (newsId) return;
    const hasContent = name.trim() || description.trim() || link.trim() || options.some((o) => o.text.trim()) || hasImages;
    try {
      if (!hasContent) localStorage.removeItem(DRAFT_KEY);
      else localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, role, description, options: options.map(({ text, color }) => ({ text, color })), link, images: hasImages, savedAt: Date.now() }));
    } catch {
      // localStorage unavailable - drafts just won't persist.
    }
  }, [name, role, description, options, link, newsId, hasImages]);

  // Pictures follow the text into the draft, by answer position.
  useEffect(() => {
    if (newsId || !imagesReady) return;
    void saveDraftImages({ main: contentImageFile, options: options.map((o) => o.file) });
  }, [contentImageFile, options, newsId, imagesReady]);

  const discardDraft = () => {
    setName('');
    setRole('politics');
    setDescription('');
    options.forEach((o) => { if (o.preview) URL.revokeObjectURL(o.preview); });
    setOptions(startOptions());
    setLink('');
    setLinkOpen(false);
    setContentImageFile(null);
    setContentPreviewUrl(null);
    setContentImageError(null);
    setRestoredDraft(null);
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    void clearDraftImages();
  };

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
      // Permission denied / unavailable - the user can still type.
    }
  };

  // Answers: text only, one or two words, case-insensitive duplicates refused.
  const setOption = (i: number, v: string) => setOptions((prev) => prev.map((o, k) => (k === i ? { ...o, text: stripEmoji(v).slice(0, POLL_OPTION_MAX) } : o)));
  const addOption = () => setOptions((prev) => (prev.length < POLL_OPTIONS_MAX ? [...prev, blankOption(prev.map((o) => o.color))] : prev));
  const removeOption = (i: number) => setOptions((prev) => {
    if (prev.length <= POLL_OPTIONS_MIN) return prev;
    if (prev[i].preview) URL.revokeObjectURL(prev[i].preview!);
    return prev.filter((_, k) => k !== i);
  });
  // Picking a colour another answer holds swaps the two.
  const pickColor = (i: number, color: string) => setOptions((prev) => {
    const old = prev[i].color;
    return prev.map((o, k) => (k === i ? { ...o, color } : o.color === color ? { ...o, color: old } : o));
  });
  const pickOptionImage = (i: number) => { optionFileIndex.current = i; optionFileRef.current?.click(); };
  const handleOptionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setOptionImageError(null);
    if (!ACCEPTED_CONTENT_MIMES.includes(file.type)) { setOptionImageError('JPEG, PNG or WebP only'); return; }
    if (file.size > MAX_CONTENT_UPLOAD_BYTES) { setOptionImageError('Image must be under 10 MB'); return; }
    const i = optionFileIndex.current;
    setOptions((prev) => prev.map((o, k) => {
      if (k !== i) return o;
      if (o.preview) URL.revokeObjectURL(o.preview);
      return { ...o, file, preview: URL.createObjectURL(file) };
    }));
  };
  const removeOptionImage = (i: number) => setOptions((prev) => prev.map((o, k) => {
    if (k !== i) return o;
    if (o.preview) URL.revokeObjectURL(o.preview);
    return { ...o, file: null, preview: null };
  }));
  const filledOptions = options.map((o) => ({ ...o, text: o.text.replace(/\s+/g, ' ').trim() })).filter((o) => o.text);
  const lowered = filledOptions.map((o) => o.text.toLowerCase());
  const duplicateIndex = new Set(lowered.filter((o, i) => lowered.indexOf(o) !== i));
  const hasDuplicate = duplicateIndex.size > 0;

  const mutation = useMutation({
    mutationFn: async (fields: { name: string; role: Role; description: string; options: FormOption[]; link?: string }) => {
      let image: { url: string; key: string; thumbUrl: string; thumbKey: string } | undefined;
      if (contentImageFile) {
        try {
          image = await uploadContentImage(contentImageFile);
        } catch (err) {
          const status = (err as { status?: number } | null)?.status;
          setContentImageError(status === 422 ? t.contentImageBlocked : t.contentImageUploadError);
          throw err;
        }
      }
      // Answer pictures upload together; any failure stops the submit.
      let optionImages: ({ thumbUrl: string; thumbKey: string } | null)[];
      try {
        optionImages = await Promise.all(fields.options.map((o) => (o.file ? uploadOptionImage(o.file) : Promise.resolve(null))));
      } catch (err) {
        const status = (err as { status?: number } | null)?.status;
        setOptionImageError(status === 422 ? t.contentImageBlocked : t.contentImageUploadError);
        throw err;
      }
      return addNewProfile({
        ...fields,
        options: fields.options.map((o, i) => ({
          text: o.text,
          color: o.color,
          imageUrl: optionImages[i]?.thumbUrl,
          imageKey: optionImages[i]?.thumbKey,
        })),
        imageUrl: image?.thumbUrl,
        imageKey: image?.thumbKey,
        contentImageUrl: image?.url,
        contentImageKey: image?.key,
        newsId: newsId ?? undefined,
      });
    },
    onSuccess: (created) => {
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      void clearDraftImages();
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      // Straight to the new poll - the author is its first likely voter.
      navigate('/p/' + created.id + location.search, { replace: true });
    },
    onError: (err) => {
      const msg = (err as Error).message;
      setSubmitError(msg === 'duplicate_poll' ? p.duplicatePoll : msg === 'duplicate_option' ? p.duplicateOption : null);
    },
  });

  // A draft saved under the old 80-char cap can come back longer: the red
  // counter shows it and Post waits for a shorter question, rather than cutting
  // the text mid-word.
  const canSubmit = name.trim().length > 0 && name.length <= POLL_TITLE_MAX && filledOptions.length >= POLL_OPTIONS_MIN && !hasDuplicate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!canSubmit || isBlocked || mutation.isPending) return;
    const trimmedLink = link.trim();
    if (trimmedLink && !isValidLink(trimmedLink)) {
      setLinkError(t.linkInvalid);
      setLinkOpen(true);
      return;
    }
    mutation.mutate({
      name: name.replace(/\s+/g, ' ').trim(),
      role,
      description: description.trim(),
      options: filledOptions,
      link: trimmedLink || undefined,
    });
  };

  const preview = <PollPreview name={name} role={role} options={options} thumbUrl={contentPreviewUrl} />;

  return (
    <ModalShell
      onClose={onClose}
      title={t.addProfileTitle}
      icon={<NewPollIcon className="w-5 h-5" />}
      maxWidth="max-w-4xl"
      desktopScrollable
    >
      <div className="md:flex md:items-stretch">
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 md:flex-1 md:min-w-0">
        {restoredDraft && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-xs text-white/70">{t.draftRestored}</p>
            <button type="button" onClick={discardDraft} className="shrink-0 text-xs font-medium text-accent hover:text-accent/80 transition-colors">
              {t.draftDiscard}
            </button>
          </div>
        )}
        {fromNews?.newsTitle && (
          <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
            {p.askAboutThis}: <span className="text-white/90 font-medium">{fromNews.newsTitle}</span>
          </p>
        )}

        {/* The question, with the poll's one picture inline to its left - the
            pair is what a list card shows, so they are chosen together. The
            picture is optional: the upload keeps it full size for the detail
            and cuts the square thumbnail for lists. The remove badge sits in
            its own non-clipping box, partly outside the square, and is not
            nested in the picker button (no button inside a button). */}
        <div>
          <label className={LABEL} htmlFor="poll-question">{p.questionLabel}</label>
          <div className="flex items-center gap-2.5">
            <div className="relative w-11 h-11 shrink-0">
              <HoverTip label={contentPreviewUrl ? t.contentImageChange : p.imageLabel} className="contents">
                <button
                  type="button"
                  onClick={() => contentFileInputRef.current?.click()}
                  aria-label={contentPreviewUrl ? t.contentImageChange : p.imageLabel}
                  className={`group w-11 h-11 rounded-lg overflow-hidden bg-surface transition-colors ${
                    contentPreviewUrl ? 'border border-border hover:border-white/25' : 'border border-dashed border-white/25 hover:border-white/50'
                  }`}
                >
                  {contentPreviewUrl ? (
                    <>
                      <img src={contentPreviewUrl} alt="" className="w-full h-full object-cover" />
                      <span className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </span>
                    </>
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-white/50 group-hover:text-white/85 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M21 3.75H3A.75.75 0 002.25 4.5v15a.75.75 0 00.75.75h18a.75.75 0 00.75-.75v-15A.75.75 0 0021 3.75z" />
                      </svg>
                    </span>
                  )}
                </button>
              </HoverTip>
              {contentPreviewUrl && (
                <HoverTip label={t.contentImageRemove} className="contents">
                  <button
                    type="button"
                    onClick={() => {
                      setContentImageFile(null);
                      URL.revokeObjectURL(contentPreviewUrl);
                      setContentPreviewUrl(null);
                      setContentImageError(null);
                      if (contentFileInputRef.current) contentFileInputRef.current.value = '';
                    }}
                    aria-label={t.contentImageRemove}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-surface border border-border rounded-full text-white/60 hover:text-white hover:border-white/40 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </HoverTip>
              )}
            </div>
          <input
            id="poll-question"
            type="text"
            placeholder={p.questionPlaceholder}
            value={name}
            onChange={(e) => setName(stripEmoji(e.target.value).slice(0, Math.max(POLL_TITLE_MAX, name.length)))}
            maxLength={POLL_TITLE_MAX}
            className={`${INPUT} flex-1 min-w-0`}
            required
            autoFocus={!isMobile}
          />
          </div>
          <p translate="no" className={`${COUNTER} notranslate ${name.length >= POLL_TITLE_MAX - 5 ? 'text-red-400' : ''}`}>
            {name.length} / {POLL_TITLE_MAX}
          </p>
          {contentImageError && <p className={ERROR}>{contentImageError}</p>}
          <input ref={contentFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleContentFileChange} />
        </div>

        {/* Answers, 2-5, in the order the author gives. */}
        <div>
          <label className={LABEL}>{p.optionsLabel}</label>
          <div className="space-y-1.5">
            {options.map((o, i) => {
              const dup = !!o.text.trim() && duplicateIndex.has(o.text.replace(/\s+/g, ' ').trim().toLowerCase());
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <OptionColorPicker
                    value={o.color}
                    taken={options.filter((_, k) => k !== i).map((x) => x.color)}
                    onPick={(c) => pickColor(i, c)}
                    label={p.optionColor}
                  />
                  {o.preview ? (
                    <HoverTip label={p.optionPictureRemove}>
                      <button
                        type="button"
                        onClick={() => removeOptionImage(i)}
                        aria-label={p.optionPictureRemove}
                        className="group/pic relative shrink-0 w-9 h-9 rounded-full"
                      >
                        <OptionAvatar color={o.color} imageUrl={o.preview} className="w-9 h-9" />
                        <span className="absolute inset-0 rounded-full bg-black/45 flex items-center justify-center md:opacity-0 group-hover/pic:opacity-100 transition-opacity">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      </button>
                    </HoverTip>
                  ) : (
                    <HoverTip label={p.optionPicture}>
                      <button
                        type="button"
                        onClick={() => pickOptionImage(i)}
                        aria-label={p.optionPicture}
                        className="shrink-0 w-9 h-9 rounded-full border border-dashed border-white/25 text-white/50 hover:text-white/90 hover:border-white/50 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M21 3.75H3A.75.75 0 002.25 4.5v15a.75.75 0 00.75.75h18a.75.75 0 00.75-.75v-15A.75.75 0 0021 3.75z" />
                        </svg>
                      </button>
                    </HoverTip>
                  )}
                  <input
                    type="text"
                    value={o.text}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={p.optionPlaceholder}
                    maxLength={POLL_OPTION_MAX}
                    aria-label={`${p.optionsLabel} ${i + 1}`}
                    className={`${INPUT} flex-1 min-w-0 ${dup ? 'border-red-400/70' : ''}`}
                  />
                  <span translate="no" className="w-9 shrink-0 text-right text-xs tabular-nums text-white/50 notranslate">{o.text.length}/{POLL_OPTION_MAX}</span>
                  <HoverTip label={p.removeOption}>
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      disabled={options.length <= POLL_OPTIONS_MIN}
                      aria-label={p.removeOption}
                      className="p-1 text-white/40 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </HoverTip>
                </div>
              );
            })}
          </div>
          {hasDuplicate && <p className={ERROR}>{p.duplicateOption}</p>}
          {optionImageError && <p className={ERROR}>{optionImageError}</p>}
          <input ref={optionFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleOptionFileChange} />
          {options.length < POLL_OPTIONS_MAX && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 flex w-fit items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
              {p.addOption}
            </button>
          )}
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

        {/* Description — emoji are allowed here (the statement stays text-only).
            The picker floats as an absolutely-positioned popover that opens
            upward, so opening it never changes the form's height. */}
        <div>
          <label className={LABEL}>{p.descriptionOptional}</label>
          <div ref={emojiWrapRef} className="relative">
            <textarea
              ref={descriptionRef}
              placeholder={t.descriptionPlaceholder}
              value={description}
              maxLength={POLL_BODY_MAX}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${INPUT} resize-none pr-10`}
            />
            <HoverTip label={t.emojiAdd} className="contents">
            <button
              type="button"
              onClick={() => setEmojiOpen((v) => !v)}
              aria-label={t.emojiAdd}
              className={`absolute bottom-2 right-2 flex items-center justify-center w-7 h-7 rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors ${emojiOpen ? 'bg-white/5 text-white/80' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
              </svg>
            </button>
            </HoverTip>
            {emojiOpen && (
              <div className="absolute bottom-full right-0 mb-2 z-30">
                <EmojiPickerPopover onPick={insertEmoji} />
              </div>
            )}
          </div>
          <p translate="no" className={`${COUNTER} notranslate ${description.length >= POLL_BODY_MAX - 20 ? 'text-red-400' : ''}`}>
            {description.length} / {POLL_BODY_MAX}
          </p>
        </div>

        {/* Attachments: the link (the picture sits by the question). */}
        <div className="space-y-2">
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

        {submitError && <p className={ERROR}>{submitError}</p>}
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
                <span className="text-white/50">{t.blockedUntilLabel}:</span>{' '}
                <span className="text-white/80 font-medium">
                  {blockedUntilDate!.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </p>
              <p className="text-[11px] text-white/50 mt-1.5">
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
            disabled={!canSubmit || mutation.isPending}
            // Brand accent (#e94560) - the app-wide primary CTA color (matches
            // SupportModal / report / welcome). Disabled until the required
            // fields are valid, so it gates rather than validating post-click.
            className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? t.adding : p.askButton}
          </button>
        )}
      </form>
      <aside className="border-t md:border-t-0 md:border-l border-border bg-black/20 px-5 py-4 md:flex md:flex-col md:w-96 md:shrink-0">
        <div className="md:sticky md:top-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/50 mb-2">{p.previewTitle}</p>
          {preview}
        </div>
      </aside>
      </div>
    </ModalShell>
  );
}
