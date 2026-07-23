---
title: 'The Serverless Stack Behind This Portfolio: Astro, Workers, R2, Neon'
description: A real teardown of the exact stack this site runs on — Postgres content, R2 images, KV sessions, one Worker — plus the config-drift bug that took it down.
date: 2026-07-23
tags: ['architecture', 'cloudflare', 'astro', 'serverless']
category: 'architecture'
cover: /uploads/hero-serverless.svg
featured: false
draft: false
---

Most "serverless architecture" posts describe someone else's stack, secondhand, from a vendor's diagram. This one describes the stack this exact site is running on right now, including the bug that broke it in production.

## The shape of it

```text
Browser ──▶ Cloudflare Worker (Astro SSR, output: 'server' at request time)
              │
              ├──▶ ASSETS binding   — prebuilt static files, hashed + immutable-cached
              ├──▶ SESSION (KV)     — cookie-backed session store, adapter-managed
              ├──▶ IMAGES binding   — on-the-fly resize/format for astro:assets
              ├──▶ UPLOADS (R2)     — admin-uploaded post/project cover images
              └──▶ Neon (Postgres)  — posts + projects, over plain HTTPS (neon-http driver)
```

One Worker, five different backing services, and — this is the part that matters — every single one of them is optional at the code level. That's not an accident.

## Content has three fallback tiers, and that's the actual design

Every read in this app — blog posts, projects — goes through a repository function with an explicit precedence:

```ts
export async function getPosts(): Promise<PostMeta[]> {
  if (dbEnabled()) {
    // live query against Postgres
  }
  if (API_ENABLED) {
    // a future REST API
  }
  // Content Collections: local markdown in src/content/blog
}
```

`dbEnabled()` is just `Boolean(DATABASE_URL)`. In production it's always true, so the database is the real source of truth. But locally, on a fresh clone with zero setup, the exact same page components render from markdown files in the repo instead — no database, no API keys, `npm run dev` just works. The repository layer is the only thing that knows which source is live; nothing above it branches on that fact.

The tradeoff nobody tells you about this pattern: it doubles the places a field can silently drift. This site's own `posts` table stores a `cover` column as a plain string URL, while the local markdown schema originally required `image()` — Astro's typed local-asset helper, which needs a real co-located file to resolve. Same field, two incompatible shapes, reconciled by a repository function doing a runtime `typeof` check. The actual fix, eventually, was making the frontmatter schema `z.string()` too — one shape, not two, even though it meant giving up compile-time verification that a referenced image file exists locally.

## Images: three different lifetimes, three different homes

This is the part that took the most iteration to get right, because "just serve an image" turns out to have three genuinely different requirements depending on where the image lives:

- **Build-time static assets** (icons, the resume PDF) — `public/`, bundled into the Worker deploy, served by the `ASSETS` binding.
- **User-uploaded content** (post covers, project covers) — R2. These need to be addable *without* a redeploy, which static assets fundamentally can't do.
- **Optimized local images** (anything referenced through `astro:assets`) — the `IMAGES` binding, Cloudflare's on-the-fly resize/format pipeline.

R2 objects have no public URL of their own without configuring a custom domain, so uploads need a small read-through route:

```ts
export async function GET({ params }: APIContext) {
  const object = await env.UPLOADS.get(params.key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}
```

Nothing clever — but every field on that `Headers` object matters. Skip `writeHttpMetadata` and every uploaded image serves as `application/octet-stream`; browsers won't render it inline.

## The bug that had nothing to do with any of the code above

After wiring all of this up, a new blog post and a new project card simply didn't appear on the live site — not slowly, not partially, just absent — despite the database unquestionably having the right rows (verified directly, repeatedly, from a local script hitting the same `DATABASE_URL`).

The cause: this Worker's `DATABASE_URL` is set two different ways. Locally, it's a plain `.env` file, read by Node scripts and `astro dev`. In production, it's a Cloudflare secret, set independently via `wrangler secret put` — deliberately *not* derived from `.env`, so a local file can never accidentally leak into a deploy. At some point those two values had drifted apart. Every local script was writing to the correct database. The deployed Worker was reading from a different one, with the same schema, silently.

Nothing in the application code was wrong. The architecture worked exactly as designed. The one thing outside the code's control — which secret value actually reached the Worker — just didn't match what everything else assumed. Fixed with one command (`wrangler secret put DATABASE_URL < .env`'s value), but it's the kind of bug that no amount of TypeScript catches, because the type system has no opinion on which *environment* your connection string points at.

## What actually held up

The "one repository function decides the source" pattern held up completely — swapping the entire content backend from files to Postgres touched exactly the files under `src/lib/api/repositories/`, nothing in a page component ever needed to know or care. The R2 read-through route is eleven lines and hasn't needed a single change since. The part that failed wasn't an abstraction boundary — it was an assumption that two independently-configured secrets would always agree, which is exactly the kind of thing architecture diagrams never show.
