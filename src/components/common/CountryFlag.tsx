import { getCountryName, getCountryFlag } from '../../utils/countries';

// Cached once — checks whether the browser renders flag emoji as colored glyphs.
// On Linux/Mac it does; on Windows 11 they render as flat letter-pairs.
let _flagEmojiSupported: boolean | null = null;
function flagEmojiSupported(): boolean {
  if (_flagEmojiSupported !== null) return _flagEmojiSupported;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    if (!ctx) return (_flagEmojiSupported = false);
    ctx.font = '8px sans-serif';
    ctx.fillText('🇺🇸', 0, 8);
    const { data } = ctx.getImageData(0, 0, 10, 10);
    for (let i = 0; i < data.length; i += 4) {
      // A colored (non-grayscale) pixel means the OS rendered a real flag emoji.
      if (data[i + 3] > 0 && (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2])) {
        return (_flagEmojiSupported = true);
      }
    }
    return (_flagEmojiSupported = false);
  } catch {
    return (_flagEmojiSupported = false);
  }
}

export function FlagImg({ code, className = '' }: { code: string; className?: string }) {
  if (flagEmojiSupported()) {
    return (
      <span className={`inline-block align-middle shrink-0 ${className}`}>
        {getCountryFlag(code)}
      </span>
    );
  }
  return (
    <span
      className={`fi fi-${code.toLowerCase()} inline-block shrink-0 ${className}`}
      style={{ width: 20, height: 15, fontSize: 'initial' }}
      title={code}
    />
  );
}

export function CountryFlag({ code, showName = false }: { code: string; showName?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1" title={getCountryName(code)}>
      <FlagImg code={code} />
      {showName && <span className="text-xs text-text-secondary">{getCountryName(code)}</span>}
    </span>
  );
}
