import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // new SW activates + reloads on next visit; no stale shell
      injectRegister: 'auto', // injects the registration snippet; no code change in main.tsx
      includeAssets: ['favicon.png', 'favicon.svg', 'apple-touch-icon.png', 'icon.svg'],
      manifest: {
        name: 'Opinio',
        short_name: 'Opinio',
        description:
          'Like or dislike the statements, events and public figures shaping the world - ranked country by country, refreshed every 24h.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'en',
        theme_color: '#10162e',
        background_color: '#1a1a2e',
        categories: ['news', 'social', 'politics'],
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell only. The map data and the social OG image are not
        // needed inside the standalone app, so keep them out of the SW cache.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        globIgnores: ['**/topojson/**', 'og-image.png', 'og-image.svg'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/\.well-known\//, /^\/sitemap\.xml$/, /^\/robots\.txt$/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: { enabled: false }, // SW only in production build/preview, never in `npm run dev`
    }),
  ],
  envPrefix: ['VITE_', 'OPINIO_'],
})
