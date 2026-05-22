const API_BASE = 'https://api.opinio.live';
const SITE_BASE = 'https://opinio.live';
const DEFAULT_OG_IMAGE = `${SITE_BASE}/og-image.png`;
const ANON_OG_IMAGE = `${SITE_BASE}/icons/anonymous-mask.png`;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROFILE_PATH_RE = /^\/p\/([^\/]+)\/?$/;
const USER_PATH_RE = /^\/u\/([^\/]+)\/?$/;
const COUNTRY_PATH_RE = /^\/c\/([^\/]+)\/?$/;
const COUNTRY_CODE_RE = /^[A-Z]{2}$/;

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
async function fetchProfile(id) {
  try {
    const res = await fetch(`${API_BASE}/api/profiles/${id}`, {
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
  });

  return new Response(html, { status: 200, headers });
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
    title: 'Stats - Opinio',
    description: 'Top likers and dislikers worldwide and by country on Opinio.',
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
