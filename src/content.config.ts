/**
 * Content Collections (Astro 5 Content Layer).
 *
 * Blog posts live as Markdown/MDX in src/content/blog. The schema below is the
 * contract — frontmatter is validated at build time, so a typo fails the build
 * instead of the page. This is the recommended Astro way to model local content;
 * remote content (a CMS/API) can be added later with a custom loader here.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(90),
      description: z.string().max(200),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      cover: image().optional(),
      ogImage: z.string().optional(),
    }),
});

export const collections = { blog };
