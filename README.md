# Opinio — Frontend

React frontend for [Opinio](https://opinio.live) — a global social voting platform where anyone can browse and vote on statements, events, and public figures from around the world, organized by country on an interactive world map. Rankings refresh every 24 hours as votes expire, keeping results a live snapshot of current sentiment.

## Tech Stack

| Concern | Library |
|---------|---------|
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Data fetching | TanStack Query v5 |
| Map | react-simple-maps (SVG/TopoJSON, no API key) |
| Build | Vite |

## Running locally

Requires the API (`opinio-api`) running locally first.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build
```

The API URL is configured via `OPINIO_API_URL` in `.env` — copy `.env.example` if you don't have one yet (defaults to `http://localhost:3000`).

## Features

- **World map** (desktop) / **ranked feed** (mobile) of statements, events, and public figures
- **Rising** sidebar — top net positive scores; **Falling** sidebar — most disliked
- **Like / Dislike** voting with per-tier hourly allowances (requires country detection; warning shown if unknown)
- **Nominate** — submit a statement or event with category, long description, and avatar
- **Country filter** — searchable dropdown with flags, type to filter by name
- **Category filter** — multi-select badge dropdown; select multiple categories, dimmed = inactive
- **Mobile filter sheet** — bottom sheet with country search + category badges; filter icon in header with active-state dot
- **Country tooltip** — hover a country on the map to see top 4 rising + falling
- **Person breakdown** — hover a card to see top fan/critic countries
- **Google OAuth** — sign in to unlock higher vote allowance and settings
- **Settings modal** — display name, country override, language preference; subtle Upgrade link redirects registered users to Stripe Checkout, supporters get a Manage subscription link to the Stripe Customer Portal
- **Stats page** — community leaderboard (top likers + dislikers), country filter
- **Support page** — submit tickets, track status; admin sees all tickets with user info
- **i18n** — English, Czech, Spanish; language synced server-side for registered users
- **Animated vote counters** — smooth animation toward new value over 10 s poll window
- **10 s profile polling** — standalone interval immune to realtime cache resets
- **Vote lock** — list order frozen for 5 s after casting a vote to prevent accidental misclicks during reorder
- **Share button** — profile detail modals expose a share button that uses the Web Share API on devices that support it (mobile, macOS Safari) and falls back to clipboard copy elsewhere
- **Per-profile social previews** — `opinio.live/p/<id>` URLs return profile-specific OG meta (title, description, avatar) via a Cloudflare Worker so social cards on WhatsApp, Twitter, iMessage, etc. show the actual profile, not the site default
- **Terms & Privacy** — `/terms` and `/privacy` modal routes, linked from the About modal footer; Terms cover posting rules (no violent, aggressive, rude, or nude content), voting, subscriptions, and posting suspensions
- **Posting block notice** — when an account is temporarily blocked from posting, the Drop-an-opinion modal shows a warning panel with the unblock date and a link to support; voting stays enabled

## Project Structure

```
src/
├── api/              # HTTP client — fetch wrappers for all API endpoints
├── components/
│   ├── common/       # CountryFlag, RoleBadge
│   ├── filters/      # FilterBar, ProfileMenu, SettingsModal, AboutModal,
│   │                 #   PrivacyModal, TermsModal, StatsModal, SupportModal
│   ├── layout/       # Sidebar (desktop), MobileFeed (mobile)
│   ├── map/          # WorldMap, CountryTooltip
│   ├── profile/      # ProfileCard, Avatar, PersonTooltip, NewBadge,
│   │                 #   ProfileDetailModal
│   ├── profile-form/ # AddProfileModal (avatar upload + role picker)
│   └── voting/       # VoteButtons, VoteBanner
├── context/          # FilterContext — country + role filter via URL search params
├── hooks/            # useProfiles, useVote, useMe, useSupport, ...
├── i18n/             # Locale strings — add new locales in src/i18n/strings.ts
├── mock/             # Mock handlers for unimplemented endpoints (WebSocket)
├── types/            # TypeScript interfaces (api.ts, profile.ts)
└── utils/            # countries, roles, formatNumber

cloudflare-worker/   # Cloudflare Worker that rewrites OG meta tags for
                     # /p/<uuid> URLs so social previews show the profile
                     # instead of the site default. See its README.
```

## Deployment

GitHub Actions runs on every push to `master`:

| Job | What it does |
|-----|-------------|
| Frontend → S3 | `npm run build` then sync `dist/` to `s3://opinio.live` and `s3://www.opinio.live` |
| Cloudflare Worker (OG meta) | `npx wrangler deploy` from `cloudflare-worker/` |

Required GitHub Actions secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `CLOUDFLARE_API_TOKEN` (token needs `Account > Workers Scripts: Edit` and `Zone > Workers Routes: Edit`).

## User Tiers

| Tier | Votes / hour | Notes |
|------|-------------|-------|
| Anonymous | 1 | Identified by IP |
| Registered | 3 | Google OAuth |
| Supporter | 5 | Paid €2.99/month — Stripe-hosted Checkout |
| Admin | 5 | Full support ticket management |

## License

Source-available, not open-source. Viewing and PRs welcome; copying, forking, or redistributing is not permitted.
