<p align="center">
  <a href="https://opinio.live">
    <img src="https://opinio.live/icon.svg" alt="Opinio" width="120" height="120" />
  </a>
</p>

<h1 align="center">Opinio</h1>

<p align="center">
  <strong>Vote on the stories shaping the world today.</strong>
</p>

<p align="center">
  <a href="https://opinio.live"><strong>https://opinio.live →</strong></a>
</p>

---

## What is Opinio?

A global social voting platform. Browse and vote <span title="like">▲</span> or <span title="dislike">▼</span> on statements, events, and public figures from around the world, organized by country on an interactive map.

You see **current sentiment, not history** — every vote expires after 24 hours, so rankings are a live snapshot of how people feel right now.

## How it works

- **Rising / Falling sidebars** — top 10 by 24-hour vote count, plus up to 5 freshness slots: `NEW` for just-added profiles, `RISING` / `FALLING` for ones gaining votes in the last 6 hours.
- **World map** — hover any country to see its top 4 ▲ and top 4 ▼.
- **24-hour vote expiry** — votes age out after a day, so rankings keep moving.
- **Country breakdown** — see top fans and critics for any profile.
- **Vote allowance per hour:**
  - Anonymous — 1 vote / hr
  - Registered — 3 votes / hr
  - Supporter (€2.99 / month) — 5 votes / hr

## Our principles

- **We respect your time.** No ads, no tracking.
- **We respect your privacy.** We don't share your data with anyone. Inactive accounts are deleted after 6 months.
- **We respect your voice.** Ranking algorithms are open and publicly accessible — this is the [frontend](https://github.com/josefjadrny/opinio-fe), and the [backend](https://github.com/josefjadrny/opinio-api) lives in its own repo.

## This repository

Frontend — React 19 + TypeScript + Tailwind v4 + Vite, deployed to S3 behind CloudFlare.

```bash
npm install
npm run dev       # http://localhost:5173
```

Requires the API (`opinio-api`) running locally.

## Contributing

Bug-fix PRs are very welcome — keep them small and focused, and mention the issue or behaviour you're addressing.

Feature direction is set by the Opinio team. Before opening a PR for new functionality (new components, UX changes, larger refactors), please open an issue first so we can discuss fit with the roadmap. We may decline feature PRs that arrive without prior discussion, even when the implementation is clean — this isn't about the code, it's about keeping the product coherent.

## License

Source-available, not open-source. Viewing and PRs welcome; copying, forking, or redistributing is not permitted.

<p align="center">
  🇨🇿 Made in Czechia · 🇩🇪 Hosted in Germany · 🇪🇺 EU origin
</p>
