# Brand assets

Store and social images, kept in git. This folder is not deployed (it is outside `public/`).

| File | Used as |
|------|---------|
| `play/app-icon-512.png` | Google Play app icon |
| `play/feature-graphic-1024x500.png` | Google Play feature graphic |
| `facebook/social-avatar-1024.png` | Facebook page profile picture |
| `facebook/fb-cover-1640x607.png` | Facebook page cover photo |

These are build output: the generators live in `opinio-android/play-assets/`, and the web
icons come from `public/icon.svg` via `npm run gen:icons`. Regenerate there, then copy here.
