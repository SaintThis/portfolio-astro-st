// @ts-check
import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
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
  // Sitemap is now a request-time endpoint (src/pages/sitemap.xml.ts) instead of
  // the build-time integration, so DB-added posts/projects appear without a rebuild.
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],

    // Force eager pre-bundling of every dep pulled in by client islands —
    // especially Lanyard.tsx's heavy three.js/r3f/rapier stack, which Vite
    // otherwise only discovers on the first request that renders Hero.astro.
    // That late discovery triggers a mid-session "re-optimizing dependencies"
    // pass, which invalidates the SSR module graph *while a request is still
    // in flight* and produces "Invalid hook call" / "Cannot read properties
    // of null (reading 'useRef')" errors from React/zustand — not an actual
    // bug in the components. See known-errors.txt.
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'zustand',
        'zustand/middleware',
        'motion/react',
        'gsap',
        'gsap/ScrollTrigger',
        'three',
        '@react-three/fiber',
        '@react-three/drei',
        '@react-three/rapier',
        'meshline',
        '@base-ui/react',
        'clsx',
        'tailwind-merge',
      ],
    },
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