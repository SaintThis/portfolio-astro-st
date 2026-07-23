/**
 * Content Collections (Astro 5 Content Layer).
 *
 * Blog posts live as Markdown/MDX in src/content/blog. The schema below is the
 * contract — frontmatter is validated at build time, so a typo fails the build
 * instead of the page. This is the recommended Astro way to model local content;
 * remote content (a CMS/API) can be added later with a custom loader here.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: () =>
    z.object({
      title: z.string().max(90),
      description: z.string().max(200),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      /** A URL/path — a local co-located image would need Astro's asset
       *  pipeline (image()), but the DB-backed production path (see
       *  posts.repo.ts) only ever stores a plain string, so frontmatter
       *  matches that shape instead of requiring a bundled file. */
      cover: z.string().optional(),
      ogImage: z.string().optional(),
      // --- Flexible, additive fields (all optional so existing posts still
      // validate). These mirror what the future `posts` DB table will hold, so
      // the frontmatter → DB migration is a straight copy. Add more here freely;
      // optional-with-default keeps it backward-compatible.
      /** Single primary bucket for the blog index filter/category chips. */
      category: z.string().optional(),
      /** Groups multi-part posts (shown in the left rail as "part of a series"). */
      series: z.string().optional(),
      /** A hero video (YouTube/Vimeo/MP4 URL) rendered above the article body. */
      heroVideo: z.string().optional(),
      /** Surface on the blog index "featured" strip. */
      featured: z.boolean().default(false),
    }),
});

export const collections = { blog };
