# Opinio OG Worker

Cloudflare Worker that injects per-profile Open Graph / Twitter Card meta tags into the SPA shell HTML for `opinio.live/p/<uuid>` URLs.

## Why

Social media crawlers (WhatsApp, Twitter, Slack, iMessage, Facebook) do not run JavaScript — they grab `<meta>` tags from the raw HTML response. The SPA serves the same `index.html` for every URL, so without this worker every shared profile link previews as "Opinio — Live world rankings…" with the default OG image.

## What it does

For requests matching `/p/<uuid>`:

1. In parallel, fetch `https://api.opinio.live/api/profiles/<uuid>` and `https://opinio.live/index.html`.
2. Rewrite `<title>`, `description`, `og:*`, `twitter:*`, and the canonical link in the shell using the profile data.
3. When the avatar is the OG image, strip the default `og:image:type/width/height` hints (which are sized for the 1200x630 site card) and switch `twitter:card` to `summary` so the 128x128 avatar renders correctly.
4. Send back the modified HTML with a 5 minute edge cache.

If the API call fails the worker returns the unmodified shell with header `x-opinio-og: fallback` (success sets `x-opinio-og: profile`), so previews degrade gracefully to the site default rather than 500'ing.

Non-matching paths (or `/p/<not-a-uuid>`) pass straight through to the origin.

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
