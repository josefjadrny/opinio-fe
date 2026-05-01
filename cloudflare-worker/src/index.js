const API_BASE = 'https://api.opinio.live';
const SITE_BASE = 'https://opinio.live';
const DEFAULT_OG_IMAGE = `${SITE_BASE}/og-image.png`;
const ANON_OG_IMAGE = `${SITE_BASE}/icons/anonymous-mask.png`;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROFILE_PATH_RE = /^\/p\/([^\/]+)\/?$/;
const USER_PATH_RE = /^\/u\/([^\/]+)\/?$/;

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

// Google profile photos come back from OAuth as `=s96-c` (96×96), which
// social crawlers (WhatsApp, iMessage, Slack) reject as too small for a card
// preview. Bump Google CDN avatars up to 400×400 so the preview actually renders.
function upscaleAvatarUrl(url) {
  if (!url) return url;
  if (/lh\d+\.googleusercontent\.com/.test(url)) {
    if (/=s\d+-c/.test(url)) return url.replace(/=s\d+-c/, '=s400-c');
    if (!/[?=]/.test(url)) return url + '=s400-c';
  }
  return url;
}

async function fetchProfile(id) {
  try {
    const res = await fetch(`${API_BASE}/api/profiles/${id}`, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchUser(id) {
  try {
    const res = await fetch(`${API_BASE}/api/users/${id}`, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
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
  // Google avatar URLs are upscaled to =s400-c JPEG by upscaleAvatarUrl()
  if (/lh\d+\.googleusercontent\.com/.test(imageUrl)) {
    return { width: 400, height: 400, type: 'image/jpeg' };
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
  const [profile, shellRes] = await Promise.all([
    fetchProfile(id),
    fetchShellHtml(request),
  ]);

  const shellText = await shellRes.text();
  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=300');
  headers.set('x-opinio-og', profile ? 'profile' : 'fallback');

  if (!profile) {
    return new Response(shellText, { status: 200, headers });
  }

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
  const [user, shellRes] = await Promise.all([
    fetchUser(id),
    fetchShellHtml(request),
  ]);

  const shellText = await shellRes.text();
  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=300');
  headers.set('x-opinio-og', user ? 'user' : 'fallback');

  if (!user) {
    return new Response(shellText, { status: 200, headers });
  }

  const title = `@${user.displayName} - Opinio`;
  const profileCount = Array.isArray(user.profiles) ? user.profiles.length : 0;
  const description = truncate(
    `@${user.displayName} on Opinio — ${profileCount} reported profile${profileCount === 1 ? '' : 's'}, ` +
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

export default {
  async fetch(request) {
    const url = new URL(request.url);

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

    return fetch(request);
  },
};
