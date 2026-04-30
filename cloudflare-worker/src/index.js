const API_BASE = 'https://api.opinio.live';
const SITE_BASE = 'https://opinio.live';
const DEFAULT_OG_IMAGE = `${SITE_BASE}/og-image.png`;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROFILE_PATH_RE = /^\/p\/([^\/]+)\/?$/;

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

  // Avatars are 128x128 squares — strip the default 1200x630 PNG hints
  // and switch the Twitter card to the small "summary" layout. Without this
  // WhatsApp / Twitter / iMessage see the size mismatch and either reject the
  // image or fall back to the default site OG.
  if (meta.isAvatar) {
    out = removeMetaTag(out, 'property="og:image:type"');
    out = removeMetaTag(out, 'property="og:image:width"');
    out = removeMetaTag(out, 'property="og:image:height"');
    out = replaceMetaContent(out, 'name="twitter:card"', 'summary');
  }

  out = out.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/i,
    `$1${url}$2`
  );
  return out;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(PROFILE_PATH_RE);
    if (!match) return fetch(request);

    const id = match[1].toLowerCase();
    if (!UUID_RE.test(id)) return fetch(request);

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
    const image = profile.imageUrl || DEFAULT_OG_IMAGE;
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
  },
};
