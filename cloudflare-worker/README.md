# Opinio OG Worker

Cloudflare Worker that injects per-page Open Graph / Twitter Card meta tags into the SPA shell HTML for `opinio.live/p/<uuid>`, `opinio.live/u/<uuid>`, and `opinio.live/c/<XX>` URLs. Also proxies the dynamic sitemap at `opinio.live/sitemap.xml`.

## Why

Social media crawlers (WhatsApp, Twitter, Slack, iMessage, Facebook) do not run JavaScript — they grab `<meta>` tags from the raw HTML response. The SPA serves the same `index.html` for every URL, so without this worker every shared link previews as "Opinio — Live world rankings…" with the default OG image. The sitemap proxy keeps `opinio.live` (not `api.opinio.live`) as the canonical host Google sees, since cross-host sitemaps are ignored unless both hosts are verified.

## What it does

For requests matching `/p/<uuid>`, `/u/<uuid>`, or `/c/<XX>`:

1. In parallel, fetch the relevant API resource (`/api/profiles/<uuid>`, `/api/users/<uuid>`, or `/api/countries`) and `https://opinio.live/index.html`.
2. Rewrite `<title>`, `description`, `og:*`, `twitter:*`, and the canonical link in the shell using the API data.
3. For profile/user pages, strip the default `og:image:type/width/height` hints (sized for the 1200x630 site card) and switch `twitter:card` to `summary` so the 128x128 avatar (or the anonymous-mask fallback for users without an avatar) renders correctly. Country pages keep the default 1200x630 site card.
4. Send back the modified HTML with a 5 minute edge cache.

If the API call fails the worker returns the unmodified shell with header `x-opinio-og: fallback` (success sets `x-opinio-og: profile`, `user`, or `country`), so previews degrade gracefully to the site default rather than 500'ing. User detail returns 404 for anonymous accounts, so deleted/unknown user shares fall back automatically.

For `/sitemap.xml`: fetch `https://api.opinio.live/sitemap.xml` and stream it back with a 10-minute edge cache and `x-opinio-og: sitemap`. Returns 502 if the API is unreachable.

Non-matching paths (or non-UUID/non-2-letter slugs) pass straight through to the origin.

## Deploying

Deploys automatically via GitHub Actions on every push to `master` (`deploy-worker` job in `.github/workflows/deploy.yml`).

Manual deploy:

```bash
npm install
npx wrangler deploy
```

The first manual deploy needs `npx wrangler login` (OAuth in your browser). CI uses the `CLOUDFLARE_API_TOKEN` GitHub Actions secret instead.

## Local dev

```bash
npx wrangler dev      # runs the worker locally
npx wrangler tail     # streams live logs from the deployed worker
```

## Configuration

Route and worker name are in `wrangler.toml`. The worker has no environment variables — it points at the public `api.opinio.live` and `opinio.live` endpoints directly.
