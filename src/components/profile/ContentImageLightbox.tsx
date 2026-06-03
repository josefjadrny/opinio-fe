import { useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';

const API_URL = import.meta.env.OPINIO_API_URL as string;

interface ContentImageLightboxProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

// The images host sends no CORS header and the `download` attribute is ignored
// cross-origin, so a direct link just opens the image. Route through the API's
// download endpoint instead — it streams the object back with
// Content-Disposition: attachment, which downloads on desktop + mobile.
function downloadUrl(imageUrl: string): string {
  try {
    const key = new URL(imageUrl).pathname.replace(/^\/+/, '');
    return `${API_URL}/api/images/download?key=${encodeURIComponent(key)}`;
  } catch {
    return imageUrl;
  }
}

// Full-bleed image viewer. Renders above the existing modal (z-60 vs modal's z-50)
// so the user can click out without dismissing the underlying profile sheet.
// Backdrop click / ESC close; centered download link in the bottom-right.
export function ContentImageLightbox({ imageUrl, alt, onClose }: ContentImageLightboxProps) {
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/85 p-4 pointer-events-auto"
      style={{ zIndex: 60 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <img
        src={imageUrl}
        alt={alt}
        className="max-w-full max-h-full object-contain shadow-2xl"
      />
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <a
          href={downloadUrl(imageUrl)}
          download
          onClick={(e) => e.stopPropagation()}
          className="px-3 py-1.5 text-xs font-medium bg-black/60 hover:bg-black/80 text-white rounded-lg ring-1 ring-white/15 backdrop-blur-sm transition-colors"
        >
          {t.lightboxDownload}
        </a>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          title={t.close}
          className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg ring-1 ring-white/15 backdrop-blur-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
