// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { SITE } from './src/config.ts';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // SITE.url is the single source of truth (src/config.ts) — drives canonical
  // URLs, sitemap, RSS & OG tags. Update it there, not here.
  site: SITE.url,

  // `static` today (fast, cheap, SEO-friendly). When you add a real backend/API,
  // flip to `output: 'server'` (or `hybrid`) and add an adapter — see ARCHITECTURE.md.
  output: 'static',

  // Only ship JS for the islands that need it. Keep this lean.
  integrations: [
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  // Cross-page smoothness + drives the intro loader on navigation.
  // (Astro's View Transitions are enabled per-layout via <ClientRouter />.)
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  image: {
    // Astro's built-in sharp-based optimization. Add remote patterns here
    // once images come from a CMS/API.
    responsiveStyles: true,
  },

  build: {
    inlineStylesheets: 'auto',
  },

  adapter: cloudflare(),
});