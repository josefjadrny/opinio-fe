const API_BASE = 'https://api.opinio.live';
const SITE_BASE = 'https://opinio.live';
const DEFAULT_OG_IMAGE = `${SITE_BASE}/og-image.png`;
const ANON_OG_IMAGE = `${SITE_BASE}/icons/anonymous-mask.png`;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROFILE_PATH_RE = /^\/p\/([^\/]+)\/?$/;
// Language-suffixed profile page, e.g. /p/<uuid>/fr. These are crawler-facing,
// server-rendered translated pages (see handleProfileLang) — the SPA is NOT
// involved and stays untouched. English lives on the bare /p/<uuid> URL and is
// the x-default; only the four non-English locales get a suffix.
const PROFILE_LANG_PATH_RE = /^\/p\/([^\/]+)\/(cs|es|de|fr)\/?$/;
const USER_PATH_RE = /^\/u\/([^\/]+)\/?$/;
const COUNTRY_PATH_RE = /^\/c\/([^\/]+)\/?$/;
const COUNTRY_CODE_RE = /^[A-Z]{2}$/;

// Locales that get their own suffixed URL. English is excluded — it stays on
// the bare path and is emitted as hreflang="en" + x-default. Keep in sync with
// the i18n LANGUAGES set and the API sitemap's PREFIX_LANGS.
const PREFIX_LANGS = ['cs', 'es', 'de', 'fr'];

// Per-locale chrome for the standalone translated profile page. Descriptive
// copy uses the natural word for "opinion" per locale (not the invariable
// "opinio" brand token, which is reserved for interactive UI); punctuation is
// plain ASCII hyphens.
const LANG_UI = {
  cs: {
    ogLocale: 'cs_CZ',
    cta: 'Hlasovat na Opinio',
    tagline: 'Živé světové žebříčky názorů, lidí a myšlenek - hlasované po zemích.',
    likes: 'líbí se', dislikes: 'nelíbí se',
    original: 'Originál:',
    gone: 'Tento názor už není dostupný.',
    home: 'Zpět na Opinio',
  },
  es: {
    ogLocale: 'es_ES',
    cta: 'Vota en Opinio',
    tagline: 'Rankings mundiales en vivo de opiniones, personas e ideas - votados por país.',
    likes: 'me gusta', dislikes: 'no me gusta',
    original: 'Original:',
    gone: 'Esta opinión ya no está disponible.',
    home: 'Volver a Opinio',
  },
  de: {
    ogLocale: 'de_DE',
    cta: 'Auf Opinio abstimmen',
    tagline: 'Live-Weltranglisten von Meinungen, Menschen und Ideen - nach Ländern abgestimmt.',
    likes: 'Likes', dislikes: 'Dislikes',
    original: 'Original:',
    gone: 'Diese Meinung ist nicht mehr verfügbar.',
    home: 'Zurück zu Opinio',
  },
  fr: {
    ogLocale: 'fr_FR',
    cta: 'Voter sur Opinio',
    tagline: "Classements mondiaux en direct d'opinions, de personnes et d'idées - votés par pays.",
    likes: "j'aime", dislikes: "je n'aime pas",
    original: 'Original:',
    gone: "Cette opinion n'est plus disponible.",
    home: 'Retour à Opinio',
  },
};

// Mirrors opinio-fe/src/utils/countries.ts ALL_COUNTRY_NAMES — used to render
// country OG cards server-side without an API round-trip. Keep the two in sync.
const COUNTRY_NAMES = {
  AF: 'Afghanistan', AL: 'Albania', DZ: 'Algeria', AR: 'Argentina', AU: 'Australia',
  AT: 'Austria', BD: 'Bangladesh', BE: 'Belgium', BR: 'Brazil', BG: 'Bulgaria',
  CA: 'Canada', CL: 'Chile', CN: 'China', CO: 'Colombia', HR: 'Croatia',
  CU: 'Cuba', CZ: 'Czechia', DK: 'Denmark', EG: 'Egypt', FI: 'Finland',
  FR: 'France', DE: 'Germany', GR: 'Greece', HU: 'Hungary', IN: 'India',
  ID: 'Indonesia', IR: 'Iran', IQ: 'Iraq', IE: 'Ireland', IL: 'Israel',
  IT: 'Italy', JP: 'Japan', KE: 'Kenya', KR: 'South Korea', KP: 'North Korea',
  MX: 'Mexico', MA: 'Morocco', NL: 'Netherlands', NZ: 'New Zealand', NG: 'Nigeria',
  NO: 'Norway', PK: 'Pakistan', PE: 'Peru', PH: 'Philippines', PL: 'Poland',
  PT: 'Portugal', RO: 'Romania', RU: 'Russia', SA: 'Saudi Arabia', RS: 'Serbia',
  SG: 'Singapore', ZA: 'South Africa', ES: 'Spain', SE: 'Sweden', CH: 'Switzerland',
  TW: 'Taiwan', TH: 'Thailand', TR: 'Turkey', UA: 'Ukraine', AE: 'UAE',
  GB: 'United Kingdom', US: 'United States', VE: 'Venezuela', VN: 'Vietnam',
  AM: 'Armenia', AO: 'Angola', AZ: 'Azerbaijan', BA: 'Bosnia and Herzegovina',
  BF: 'Burkina Faso', BJ: 'Benin', BO: 'Bolivia',
  BS: 'Bahamas', BT: 'Bhutan', BW: 'Botswana', BN: 'Brunei',
  BI: 'Burundi', BZ: 'Belize', BY: 'Belarus', CD: 'DR Congo',
  CF: 'Central African Republic', CG: 'Republic of Congo', CI: "Côte d'Ivoire",
  CM: 'Cameroon', CR: 'Costa Rica', CY: 'Cyprus', DJ: 'Djibouti',
  DO: 'Dominican Republic', EC: 'Ecuador', EE: 'Estonia', EH: 'Western Sahara',
  ER: 'Eritrea', ET: 'Ethiopia', FJ: 'Fiji', FK: 'Falkland Islands',
  GA: 'Gabon', GE: 'Georgia', GH: 'Ghana', GL: 'Greenland',
  GM: 'Gambia', GN: 'Guinea', GQ: 'Equatorial Guinea', GT: 'Guatemala',
  GW: 'Guinea-Bissau', GY: 'Guyana', HN: 'Honduras', HT: 'Haiti',
  IS: 'Iceland', JM: 'Jamaica', JO: 'Jordan', KG: 'Kyrgyzstan',
  KH: 'Cambodia', KW: 'Kuwait', KZ: 'Kazakhstan', LA: 'Laos',
  LB: 'Lebanon', LK: 'Sri Lanka', LR: 'Liberia', LS: 'Lesotho',
  LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia', LY: 'Libya',
  MD: 'Moldova', ME: 'Montenegro', MG: 'Madagascar', MK: 'North Macedonia',
  ML: 'Mali', MM: 'Myanmar', MN: 'Mongolia', MR: 'Mauritania',
  MW: 'Malawi', MY: 'Malaysia', MZ: 'Mozambique', NA: 'Namibia',
  NC: 'New Caledonia', NE: 'Niger', NI: 'Nicaragua', NP: 'Nepal',
  OM: 'Oman', PA: 'Panama', PG: 'Papua New Guinea', PS: 'Palestine',
  PY: 'Paraguay', QA: 'Qatar', RW: 'Rwanda', SB: 'Solomon Islands',
  SD: 'Sudan', SL: 'Sierra Leone', SK: 'Slovakia', SI: 'Slovenia',
  SN: 'Senegal', SO: 'Somalia', SR: 'Suriname', SS: 'South Sudan',
  SV: 'El Salvador', SY: 'Syria', SZ: 'Eswatini', TD: 'Chad',
  TJ: 'Tajikistan', TL: 'Timor-Leste', TG: 'Togo', TM: 'Turkmenistan',
  TT: 'Trinidad and Tobago', TN: 'Tunisia', TZ: 'Tanzania', UG: 'Uganda',
  UY: 'Uruguay', UZ: 'Uzbekistan', VU: 'Vanuatu', YE: 'Yemen',
  ZM: 'Zambia', ZW: 'Zimbabwe',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(value, max) {
  const s = String(value ?? '').trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

const GOOGLE_AVATAR_SIZE = 256;

// Google profile photos come back from OAuth as `=s96-c` (96×96), which
// social crawlers reject as too small for a card preview. Bump them to a
// mid-size square that's high enough for WhatsApp/Twitter to accept but
// small enough that they render as a compact inline thumbnail rather than
// a full-width hero image (≥300px tends to trip the big-preview heuristic).
function upscaleAvatarUrl(url) {
  if (!url) return url;
  if (/lh\d+\.googleusercontent\.com/.test(url)) {
    if (/=s\d+-c/.test(url)) return url.replace(/=s\d+-c/, `=s${GOOGLE_AVATAR_SIZE}-c`);
    if (!/[?=]/.test(url)) return `${url}=s${GOOGLE_AVATAR_SIZE}-c`;
  }
  return url;
}

// Returns a discriminated result so callers can distinguish a genuine
// "entity does not exist" (upstream 404 → SEO 404) from a transient API
// outage (5xx / network / timeout → keep serving the 200 shell). A naive
// "null means not-found" would turn an API blip into 404s for live content
// and tell crawlers to drop real profiles.
//   { ok: true,  data }                  — upstream 200
//   { ok: false, notFound: true }        — upstream 404 (genuinely gone)
//   { ok: false, notFound: false }       — 5xx / other non-200 / network / timeout
async function fetchProfile(id, lang) {
  try {
    // ?lang= makes the API COALESCE to the translated columns (falls back to the
    // original when a translation is missing, so this is never an error path).
    const qs = lang ? `?lang=${lang}` : '';
    const res = await fetch(`${API_BASE}/api/profiles/${id}${qs}`, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (res.ok) return { ok: true, data: await res.json() };
    return { ok: false, notFound: res.status === 404 };
  } catch {
    return { ok: false, notFound: false };
  }
}

async function fetchUser(id) {
  try {
    const res = await fetch(`${API_BASE}/api/users/${id}`, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (res.ok) return { ok: true, data: await res.json() };
    return { ok: false, notFound: res.status === 404 };
  } catch {
    return { ok: false, notFound: false };
  }
}

async function fetchCountryCounts(code) {
  try {
    // 60s edge cache matches the BE in-process cache, so we don't fan out behind it.
    const res = await fetch(`${API_BASE}/api/countries`, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 60, cacheEverything: true },
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (!body || !Array.isArray(body.countries)) return null;
    return body.countries.find((c) => c.code === code) ?? { code, likes: 0, dislikes: 0 };
  } catch {
    return null;
  }
}

async function handleSitemap() {
  // Proxy the API-built sitemap so opinio.live/sitemap.xml stays on the canonical
  // host (Google ignores cross-host sitemaps unless both hosts are verified).
  // 10-min edge cache mirrors the in-process cache on the API side. We let CF
  // honour the upstream Cache-Control (only set on 200s) instead of forcing
  // cacheEverything — otherwise a transient API failure caches the bad response
  // and locks the worker out for the full TTL.
  try {
    const res = await fetch(`${API_BASE}/sitemap.xml`, {
      cf: { cacheTtl: 600 },
    });
    if (!res.ok) return new Response('sitemap unavailable', { status: 502 });
    const headers = new Headers();
    headers.set('content-type', 'application/xml; charset=utf-8');
    headers.set('cache-control', 'public, max-age=600, s-maxage=600');
    headers.set('x-opinio-og', 'sitemap');
    return new Response(res.body, { status: 200, headers });
  } catch {
    return new Response('sitemap unavailable', { status: 502 });
  }
}

async function fetchShellHtml(request) {
  const url = new URL(request.url);
  url.pathname = '/index.html';
  url.search = '';
  const res = await fetch(url.toString(), {
    cf: { cacheTtl: 300, cacheEverything: true },
  });
  return res;
}

function replaceMetaContent(html, attrPattern, value) {
  const re = new RegExp(`(<meta\\s+${attrPattern}\\s+content=")[^"]*(")`, 'i');
  return html.replace(re, `$1${value}$2`);
}

function removeMetaTag(html, attrPattern) {
  const re = new RegExp(`\\s*<meta\\s+${attrPattern}[^>]*>`, 'i');
  return html.replace(re, '');
}

// Pick a reasonable square size + content-type for avatar-style images, so we
// can emit accurate og:image:width / og:image:height / og:image:type instead of
// leaving them off. WhatsApp in particular skips the preview image entirely
// when the dimensions are missing or contradicted by the URL.
function avatarDims(imageUrl) {
  if (!imageUrl) return null;
  // Google avatar URLs are upscaled to =sN-c JPEG by upscaleAvatarUrl()
  if (/lh\d+\.googleusercontent\.com/.test(imageUrl)) {
    return { width: GOOGLE_AVATAR_SIZE, height: GOOGLE_AVATAR_SIZE, type: 'image/jpeg' };
  }
  // Uploaded avatars are 128x128 JPEGs (canvas resize on the FE)
  if (/images\.opinio\.live\//.test(imageUrl) || /opinio-images(?:-dev)?\.s3\./.test(imageUrl)) {
    return { width: 128, height: 128, type: 'image/jpeg' };
  }
  // Anonymous-mask fallback (100x100 PNG)
  if (imageUrl.endsWith('/icons/anonymous-mask.png')) {
    return { width: 100, height: 100, type: 'image/png' };
  }
  return null;
}

// Build the rel=alternate hreflang set for a base path (the English/bare URL,
// e.g. "/p/<id>"). English + x-default point at the bare URL; each non-English
// locale points at its suffixed URL. Used on both the bare page (so it declares
// its translations) and every suffixed page (so the return links reciprocate).
function hreflangLinks(basePath) {
  const lines = [`<link rel="alternate" hreflang="en" href="${SITE_BASE}${basePath}" />`];
  for (const lang of PREFIX_LANGS) {
    lines.push(`<link rel="alternate" hreflang="${lang}" href="${SITE_BASE}${basePath}/${lang}" />`);
  }
  lines.push(`<link rel="alternate" hreflang="x-default" href="${SITE_BASE}${basePath}" />`);
  return lines.join('\n    ');
}

function injectProfileMeta(html, meta) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const image = escapeHtml(meta.image);
  const imageAlt = escapeHtml(meta.imageAlt);
  const url = escapeHtml(meta.url);

  let out = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  out = replaceMetaContent(out, 'name="description"', description);
  out = replaceMetaContent(out, 'property="og:title"', title);
  out = replaceMetaContent(out, 'property="og:description"', description);
  out = replaceMetaContent(out, 'property="og:url"', url);
  out = replaceMetaContent(out, 'property="og:image"', image);
  out = replaceMetaContent(out, 'property="og:image:alt"', imageAlt);
  out = replaceMetaContent(out, 'name="twitter:title"', title);
  out = replaceMetaContent(out, 'name="twitter:description"', description);
  out = replaceMetaContent(out, 'name="twitter:image"', image);
  out = replaceMetaContent(out, 'name="twitter:image:alt"', imageAlt);

  // For avatar-style square images (Google, uploaded, anonymous mask) override
  // the default 1200x630/PNG hints with the actual dimensions, and switch the
  // Twitter card to the small "summary" layout. Default is left untouched
  // when we can't recognise the source so the shell defaults still win.
  if (meta.isAvatar) {
    const dims = avatarDims(meta.image);
    if (dims) {
      out = replaceMetaContent(out, 'property="og:image:type"', dims.type);
      out = replaceMetaContent(out, 'property="og:image:width"', String(dims.width));
      out = replaceMetaContent(out, 'property="og:image:height"', String(dims.height));
    } else {
      out = removeMetaTag(out, 'property="og:image:type"');
      out = removeMetaTag(out, 'property="og:image:width"');
      out = removeMetaTag(out, 'property="og:image:height"');
    }
    out = replaceMetaContent(out, 'name="twitter:card"', 'summary');
  }

  out = out.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/i,
    `$1${url}$2`
  );

  // When a base path is supplied, declare the language alternates right after
  // the canonical so crawlers can discover the translated URLs and tie them to
  // this page (reciprocal hreflang).
  if (meta.alternatesBase) {
    out = out.replace(
      /(<link\s+rel="canonical"[^>]*>)/i,
      `$1\n    ${hreflangLinks(meta.alternatesBase)}`
    );
  }
  return out;
}

async function handleProfile(request, id) {
  const [result, shellRes] = await Promise.all([
    fetchProfile(id),
    fetchShellHtml(request),
  ]);

  const shellText = await shellRes.text();
  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=300');

  if (!result.ok) {
    // Upstream 404 → genuine not-found → SEO 404 (still serve the friendly
    // shell so the SPA renders its client-side not-found UI). Any other
    // failure (5xx / network / timeout) is a transient API outage and must
    // keep returning the 200 shell so crawlers don't drop live profiles.
    headers.set('x-opinio-og', result.notFound ? 'notfound' : 'fallback');
    return new Response(shellText, { status: result.notFound ? 404 : 200, headers });
  }

  const profile = result.data;
  headers.set('x-opinio-og', 'profile');

  const title = `${profile.name} - Opinio`;
  const descSource = profile.description || `${profile.name} on Opinio - vote like or dislike.`;
  const description = truncate(descSource, 200);
  const hasAvatar = !!profile.imageUrl;
  const image = hasAvatar ? upscaleAvatarUrl(profile.imageUrl) : DEFAULT_OG_IMAGE;
  const imageAlt = hasAvatar ? profile.name : 'Opinio live global social voting';
  const canonicalUrl = `${SITE_BASE}/p/${id}`;

  const html = injectProfileMeta(shellText, {
    title,
    description,
    image,
    imageAlt,
    url: canonicalUrl,
    isAvatar: hasAvatar,
    alternatesBase: `/p/${id}`,
  });

  return new Response(html, { status: 200, headers });
}

// Shared <head> for the standalone language pages: translated meta, a
// self-referencing canonical (the suffixed URL — NEVER the bare one, or Google
// would fold the page into English), and the reciprocal hreflang set.
function langPageHead({ lang, title, description, image, canonical, basePath }) {
  const ui = LANG_UI[lang];
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `    ${hreflangLinks(basePath)}`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="Opinio" />`,
    `<meta property="og:locale" content="${ui.ogLocale}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ].join('\n    ');
}

const LANG_PAGE_CSS =
  ':root{color-scheme:dark}*{box-sizing:border-box}' +
  'body{margin:0;background:#1a1a2e;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
  'line-height:1.5;-webkit-font-smoothing:antialiased}' +
  '.wrap{max-width:680px;margin:0 auto;padding:24px 20px 64px}' +
  'header a{color:#fff;text-decoration:none;font-weight:700;font-size:20px;letter-spacing:-.01em}' +
  'header a span{color:#e94560}' +
  '.card{margin-top:24px;background:#16213e;border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden}' +
  '.hero{width:100%;display:block;aspect-ratio:16/9;object-fit:cover;background:#0f1830}' +
  '.body{padding:20px 22px}' +
  '.meta{display:flex;gap:8px;align-items:center;font-size:13px;color:rgba(255,255,255,.6);margin-bottom:10px}' +
  '.pill{background:rgba(255,255,255,.08);border-radius:999px;padding:2px 10px;font-size:12px}' +
  'h1{font-size:24px;line-height:1.25;margin:0 0 12px}' +
  '.desc{color:rgba(255,255,255,.82);font-size:16px;margin:0 0 16px;white-space:pre-wrap}' +
  '.orig{color:rgba(255,255,255,.4);font-size:13px;margin:0 0 16px}' +
  '.counts{display:flex;gap:18px;font-size:15px;margin:0 0 20px}' +
  '.counts .up{color:#22c55e}.counts .down{color:#e94560}' +
  '.cta{display:inline-block;background:#e94560;color:#fff;text-decoration:none;font-weight:600;' +
  'padding:12px 22px;border-radius:999px;font-size:15px}' +
  '.tag{margin-top:28px;color:rgba(255,255,255,.45);font-size:13px;text-align:center}';

function renderLangPage({ id, lang, profile }) {
  const ui = LANG_UI[lang];
  const appUrl = `${SITE_BASE}/p/${id}`;
  const canonical = `${appUrl}/${lang}`;
  const name = profile.name || '';
  const description = profile.description || '';
  const translated = profile.originalName && profile.originalName !== name;
  const country = COUNTRY_NAMES[(profile.countryCode || '').toUpperCase()] || profile.countryCode || '';
  const image = profile.contentImageUrl
    || (profile.imageUrl ? upscaleAvatarUrl(profile.imageUrl) : DEFAULT_OG_IMAGE);
  const title = `${name} - Opinio`;
  const metaDesc = truncate(description || name, 200);

  const hero = profile.contentImageUrl
    ? `<img class="hero" src="${escapeHtml(profile.contentImageUrl)}" alt="${escapeHtml(name)}" />`
    : '';
  const metaLine = [
    profile.role ? `<span class="pill">${escapeHtml(profile.role)}</span>` : '',
    country ? `<span>${escapeHtml(country)}</span>` : '',
  ].filter(Boolean).join('');
  const origLine = translated
    ? `<p class="orig">${escapeHtml(ui.original)} ${escapeHtml(profile.originalName)}</p>`
    : '';

  return '<!DOCTYPE html>\n' +
    `<html lang="${lang}">\n<head>\n    <meta charset="utf-8" />\n` +
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    ' +
    langPageHead({ lang, title, description: metaDesc, image, canonical, basePath: `/p/${id}` }) +
    `\n    <style>${LANG_PAGE_CSS}</style>\n</head>\n<body>\n` +
    `  <div class="wrap">\n` +
    `    <header><a href="${SITE_BASE}/">Opin<span>io</span></a></header>\n` +
    `    <article class="card">\n      ${hero}\n      <div class="body">\n` +
    (metaLine ? `        <div class="meta">${metaLine}</div>\n` : '') +
    `        <h1>${escapeHtml(name)}</h1>\n` +
    (description ? `        <p class="desc">${escapeHtml(description)}</p>\n` : '') +
    origLine + '\n' +
    `        <div class="counts"><span class="up">▲ ${profile.likes || 0} ${escapeHtml(ui.likes)}</span>` +
    `<span class="down">▼ ${profile.dislikes || 0} ${escapeHtml(ui.dislikes)}</span></div>\n` +
    `        <a class="cta" href="${appUrl}">${escapeHtml(ui.cta)} &rarr;</a>\n` +
    `      </div>\n    </article>\n` +
    `    <p class="tag">${escapeHtml(ui.tagline)}</p>\n` +
    `  </div>\n</body>\n</html>\n`;
}

// Minimal page for a miss: 404 body when the opinio is genuinely gone, a soft
// "view on Opinio" page on a transient API outage (served 200 so crawlers keep
// the URL). Either way, never a redirect.
function renderLangMiss(lang, id, notFound) {
  const ui = LANG_UI[lang];
  const msg = notFound ? ui.gone : ui.tagline;
  return '<!DOCTYPE html>\n' +
    `<html lang="${lang}">\n<head>\n    <meta charset="utf-8" />\n` +
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    `    <title>Opinio</title>\n    <meta name="robots" content="${notFound ? 'noindex' : 'noindex'}" />\n` +
    `    <style>${LANG_PAGE_CSS}</style>\n</head>\n<body>\n  <div class="wrap">\n` +
    `    <header><a href="${SITE_BASE}/">Opin<span>io</span></a></header>\n` +
    `    <p class="tag" style="margin-top:48px">${escapeHtml(msg)}</p>\n` +
    `    <p style="text-align:center"><a class="cta" href="${SITE_BASE}/p/${id}">${escapeHtml(ui.home)} &rarr;</a></p>\n` +
    `  </div>\n</body>\n</html>\n`;
}

async function handleProfileLang(request, id, lang) {
  const result = await fetchProfile(id, lang);
  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=300');

  if (!result.ok) {
    // No SPA route backs these URLs, so we can't fall back to the shell — render
    // a small standalone miss page instead. 404 when genuinely gone; 200 on a
    // transient outage so crawlers don't drop a live translated URL.
    headers.set('x-opinio-og', result.notFound ? 'notfound' : 'fallback');
    return new Response(renderLangMiss(lang, id, result.notFound), {
      status: result.notFound ? 404 : 200,
      headers,
    });
  }

  headers.set('x-opinio-og', 'profile-lang');
  return new Response(renderLangPage({ id, lang, profile: result.data }), { status: 200, headers });
}

async function handleUser(request, id) {
  const [result, shellRes] = await Promise.all([
    fetchUser(id),
    fetchShellHtml(request),
  ]);

  const shellText = await shellRes.text();
  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=300');

  if (!result.ok) {
    // Upstream 404 → genuine not-found → SEO 404 (still serve the friendly
    // shell so the SPA renders its client-side not-found UI). Any other
    // failure (5xx / network / timeout) is a transient API outage and must
    // keep returning the 200 shell so crawlers don't drop live users.
    headers.set('x-opinio-og', result.notFound ? 'notfound' : 'fallback');
    return new Response(shellText, { status: result.notFound ? 404 : 200, headers });
  }

  const user = result.data;
  headers.set('x-opinio-og', 'user');

  const title = `@${user.displayName} - Opinio`;
  const profileCount = Array.isArray(user.profiles) ? user.profiles.length : 0;
  const description = truncate(
    `@${user.displayName} on Opinio - ${profileCount} reported profile${profileCount === 1 ? '' : 's'}, ` +
    `${user.totalLikesCast || 0} likes and ${user.totalDislikesCast || 0} dislikes cast.`,
    200,
  );
  const hasAvatar = !!user.avatarUrl;
  const image = hasAvatar ? upscaleAvatarUrl(user.avatarUrl) : ANON_OG_IMAGE;
  const imageAlt = hasAvatar ? user.displayName : 'Anonymous Opinio user';
  const canonicalUrl = `${SITE_BASE}/u/${id}`;

  const html = injectProfileMeta(shellText, {
    title,
    description,
    image,
    imageAlt,
    url: canonicalUrl,
    isAvatar: true, // both avatar and anon mask are square — use small twitter card
  });

  return new Response(html, { status: 200, headers });
}

// SPA routes that the React Router knows about but S3 doesn't have files for.
// Without these the bucket returns 404, the SPA still renders client-side, but
// crawlers see the 404 and skip indexing. Each entry is invoked through the
// matching wrangler.toml route, served as /index.html with a 200 status, and
// gets a per-page title/description for SEO and social previews.
const STATIC_PAGES = {
  '/about': {
    title: 'About - Opinio',
    description: 'About Opinio - live world rankings of people, statements, and ideas, voted on by country.',
  },
  '/privacy': {
    title: 'Privacy - Opinio',
    description: 'Opinio privacy policy: what data we store, how it is used, and how to delete it.',
  },
  '/terms': {
    title: 'Terms - Opinio',
    description: 'Opinio terms of use: posting rules, voting rules, and account terms.',
  },
  '/stats': {
    title: 'Trending opinions right now - Opinio',
    description: 'The opinions, takes and ideas getting the most votes right now on Opinio - ranked live and refreshed every 24 hours.',
  },
  '/stats/trending-countries': {
    title: 'Trending countries by votes - Opinio',
    description: 'Which countries are generating the most buzz right now - ranked by votes on their active posts, refreshed every 24 hours on Opinio.',
  },
  '/stats/top-voters': {
    title: 'Top voters leaderboard - Opinio',
    description: 'The most active voters worldwide and by country, ranked by likes and dislikes cast on Opinio.',
  },
  '/support': {
    title: 'Support - Opinio',
    description: 'Get support and report issues on Opinio.',
  },
  '/add': {
    title: 'Add an opinio - Opinio',
    description: 'Submit a new statement, person, or idea to vote on.',
  },
  '/sign-in': {
    title: 'Sign in - Opinio',
    description: 'Sign in to Opinio with Google or Microsoft to vote, post profiles, and track your activity.',
  },
};

async function handleStatic(request, page, path) {
  const shellRes = await fetchShellHtml(request);
  const shellText = await shellRes.text();
  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=300');
  headers.set('x-opinio-og', 'static');
  const html = injectProfileMeta(shellText, {
    title: page.title,
    description: page.description,
    image: DEFAULT_OG_IMAGE,
    imageAlt: 'Opinio',
    url: `${SITE_BASE}${path}`,
    isAvatar: false,
  });
  return new Response(html, { status: 200, headers });
}

function formatCountForOg(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k`;
  return String(n);
}

async function handleCountry(request, code) {
  const [counts, shellRes] = await Promise.all([
    fetchCountryCounts(code),
    fetchShellHtml(request),
  ]);
  const shellText = await shellRes.text();
  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=300');

  const name = COUNTRY_NAMES[code];
  if (!name) {
    // Country list is hardcoded in COUNTRY_NAMES (no upstream call to fail),
    // so an unknown code is a genuine not-found with no outage risk → SEO 404.
    // Still serve the friendly shell so the SPA renders its not-found UI.
    headers.set('x-opinio-og', 'notfound');
    return new Response(shellText, { status: 404, headers });
  }

  headers.set('x-opinio-og', 'country');
  const title = `${name} - Opinio`;
  const likes = counts?.likes ?? 0;
  const dislikes = counts?.dislikes ?? 0;
  const description = (likes || dislikes)
    ? `${name} on Opinio - ${formatCountForOg(likes)} likes, ${formatCountForOg(dislikes)} dislikes in the last 24h.`
    : `Live rankings and votes from ${name} on Opinio.`;
  const canonicalUrl = `${SITE_BASE}/c/${code}`;

  const html = injectProfileMeta(shellText, {
    title,
    description,
    image: DEFAULT_OG_IMAGE,
    imageAlt: `Opinio · ${name}`,
    url: canonicalUrl,
    isAvatar: false,
  });
  return new Response(html, { status: 200, headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/sitemap.xml') {
      return handleSitemap();
    }

    const staticPage = STATIC_PAGES[url.pathname];
    if (staticPage) {
      return handleStatic(request, staticPage, url.pathname);
    }

    // /p/<id>/<lang> — server-rendered translated page (checked before the bare
    // /p/<id> match). The wrangler "opinio.live/p/*" route already covers it.
    const profileLangMatch = url.pathname.match(PROFILE_LANG_PATH_RE);
    if (profileLangMatch) {
      const id = profileLangMatch[1].toLowerCase();
      const lang = profileLangMatch[2].toLowerCase();
      if (!UUID_RE.test(id)) return fetch(request);
      return handleProfileLang(request, id, lang);
    }

    const profileMatch = url.pathname.match(PROFILE_PATH_RE);
    if (profileMatch) {
      const id = profileMatch[1].toLowerCase();
      if (!UUID_RE.test(id)) return fetch(request);
      return handleProfile(request, id);
    }

    const userMatch = url.pathname.match(USER_PATH_RE);
    if (userMatch) {
      const id = userMatch[1].toLowerCase();
      if (!UUID_RE.test(id)) return fetch(request);
      return handleUser(request, id);
    }

    const countryMatch = url.pathname.match(COUNTRY_PATH_RE);
    if (countryMatch) {
      const code = countryMatch[1].toUpperCase();
      if (!COUNTRY_CODE_RE.test(code)) return fetch(request);
      return handleCountry(request, code);
    }

    return fetch(request);
  },
};
