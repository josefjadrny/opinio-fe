<p align="center">
  <a href="https://opinio.live">
    <img src="https://opinio.live/icon.svg" alt="Opinio" width="120" height="120" />
  </a>
</p>

<h1 align="center">Opinio</h1>

<p align="center">
  <strong>Ask the world. See how every country answers.</strong>
</p>

<p align="center">
  <a href="https://opinio.live"><strong>https://opinio.live →</strong></a>
</p>

---

## What is Opinio?

A world poll. Anyone can ask a question, people everywhere vote in their own language and discuss it, and the map shows how each country voted.

## How it works

- **Polls** - a question with 2 to 5 answers, each with its own colour and an optional picture.
- **One person, one vote** - results are visible to everyone, always. Votes stay; they never expire.
- **The world map** - on a poll, every country takes the colour of its leading answer. On the home page, the map shows where people voted in the last 24 hours.
- **Country pages** - what people in a country voted on, next to how the world voted.
- **Trending, new and top** - trending ranks polls by the votes of the last 24 hours, top by all votes.
- **Comments and notifications** - registered users discuss polls and hear when theirs reach new milestones.
- **Seven languages** - English, Czech, Spanish, German, French, Italian and Polish. Questions and answers are translated automatically.

## Plans

- **Anonymous** - 1 vote a day, no account needed.
- **Registered** - unlimited votes, create polls, comment, notifications.
- **Supporter** (€3.49 / month) - everything above, and it keeps Opinio running.

## Our principles

- **We respect your time.** No ads, no clutter, just questions and votes.
- **We respect your privacy.** No tracking. Nobody sees what you voted.
- **We respect your opinion.** Results are counted from votes. We never reorder them or favour an answer. This is the [frontend](https://github.com/josefjadrny/opinio-fe); the backend lives in its own repo.

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
  <br />
  <a href="https://www.facebook.com/opinio.live"><img src="https://cdn.simpleicons.org/facebook/1877F2" alt="" width="14" height="14" /> Facebook</a>
</p>
