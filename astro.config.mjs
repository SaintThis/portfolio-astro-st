// @ts-check
import { defineConfig, envField } from 'astro/config';
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

  // `static` by default (fast, cheap, SEO-friendly). With the Cloudflare adapter
  // configured, individual routes opt into on-demand SSR via
  // `export const prerender = false` — that's how the DB-backed blog/projects
  // routes render live data without making the whole site server-rendered.
  output: 'static',

  // Server env schema. DATABASE_URL is a secret, read lazily at runtime via
  // `getSecret('DATABASE_URL')` (astro:env/server). Optional so builds/CI without
  // a DB still succeed — the repo layer falls back to local fixtures/content.
  env: {
    schema: {
      DATABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },

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