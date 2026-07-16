/**
 * Blog-post CRUD tools. Writes render markdown → HTML + headings at write time
 * (same pipeline the site uses), so the stored row is display-ready and the
 * table of contents works. Category is auto-suggested when omitted.
 */
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db, schema, TARGET } from '../db.ts';
import { renderMarkdown } from '../../src/lib/db/render-markdown.ts';
import { readingTime } from '../../src/lib/utils/format.ts';
import { SITE } from '../../src/config.ts';
import { assertWritable, fail, ok, suggestCategory, toSlug, CATEGORY_SLUGS } from '../util.ts';

const writeGuardShape = {
  confirm: z.boolean().default(false).describe('Must be true to write. Set only when the user explicitly asked to save/publish.'),
  writeToken: z.string().optional().describe('Required only when the target server has MCP_WRITE_TOKEN set (e.g. production). Ask the user for it.'),
};

const postUrl = (slug: string) => new URL(`/blog/${slug}`, SITE.url).toString();

export function registerPostTools(server: McpServer) {
  server.registerTool(
    'list_posts',
    {
      title: 'List blog posts',
      description: `List all blog posts in the "${TARGET}" database (newest first), with slug, title, category, draft status, date, and view count.`,
      inputSchema: { includeDrafts: z.boolean().default(true) },
    },
    async ({ includeDrafts }) => {
      const rows = await db
        .select({
          slug: schema.posts.slug,
          title: schema.posts.title,
          category: schema.posts.category,
          draft: schema.posts.draft,
          date: schema.posts.date,
          views: schema.posts.views,
        })
        .from(schema.posts)
        .where(includeDrafts ? undefined : eq(schema.posts.draft, false))
        .orderBy(desc(schema.posts.date));
      return ok(`${rows.length} post(s) in "${TARGET}":\n` + JSON.stringify(rows, null, 2), { posts: rows });
    }
  );

  server.registerTool(
    'get_post',
    {
      title: 'Get a blog post',
      description: `Fetch one post (including its markdown source) from the "${TARGET}" database by slug.`,
      inputSchema: { slug: z.string() },
    },
    async ({ slug }) => {
      const [row] = await db.select().from(schema.posts).where(eq(schema.posts.slug, slug)).limit(1);
      if (!row) return fail(`No post with slug "${slug}".`);
      return ok(JSON.stringify(row, null, 2), { post: row });
    }
  );

  server.registerTool(
    'create_post',
    {
      title: 'Create a blog post',
      description:
        `Create a new blog post in the "${TARGET}" database. Provide the body as markdown; ` +
        `it is rendered to HTML with syntax highlighting + a table of contents at write time. ` +
        `If category is omitted it is auto-assigned from: ${CATEGORY_SLUGS.join(', ')}. ` +
        `The post is live immediately (the site reads the DB at request time). Set draft:true to stage it hidden.`,
      inputSchema: {
        title: z.string().max(90),
        description: z.string().max(200),
        markdown: z.string().describe('The post body in markdown.'),
        slug: z.string().optional().describe('Defaults to a slug derived from the title.'),
        tags: z.array(z.string()).default([]),
        category: z.string().optional().describe(`One of: ${CATEGORY_SLUGS.join(', ')}. Auto-assigned if omitted.`),
        series: z.string().optional(),
        heroVideo: z.string().optional().describe('YouTube/Vimeo/MP4 URL shown above the body.'),
        cover: z.string().optional().describe('Cover image URL/path.'),
        date: z.string().optional().describe('ISO date; defaults to now.'),
        draft: z.boolean().default(false),
        featured: z.boolean().default(false),
        ...writeGuardShape,
      },
    },
    async (args) => {
      try {
        assertWritable(args);
        const slug = toSlug(args.slug || args.title);
        const [existing] = await db.select({ slug: schema.posts.slug }).from(schema.posts).where(eq(schema.posts.slug, slug)).limit(1);
        if (existing) return fail(`A post with slug "${slug}" already exists. Use update_post instead.`);

        const category = args.category ?? suggestCategory(`${args.title}\n${args.tags.join(' ')}\n${args.markdown}`) ?? undefined;
        const { html, headings } = await renderMarkdown(args.markdown);

        await db.insert(schema.posts).values({
          slug,
          title: args.title,
          description: args.description,
          date: args.date ? new Date(args.date) : new Date(),
          tags: args.tags,
          draft: args.draft,
          category: category ?? null,
          series: args.series ?? null,
          heroVideo: args.heroVideo ?? null,
          cover: args.cover ?? null,
          featured: args.featured,
          bodyMarkdown: args.markdown,
          bodyHtml: html,
          readingTime: readingTime(args.markdown),
          meta: { headings },
          updatedAt: new Date(),
        });

        return ok(
          `Created post "${slug}" in "${TARGET}"` +
            `${args.category ? '' : ` (auto-category: ${category ?? 'none'})`}` +
            `${args.draft ? ' as a draft' : ` — live at ${postUrl(slug)}`}.`,
          { slug, category, url: postUrl(slug) }
        );
      } catch (e) {
        return fail(e instanceof Error ? e.message : String(e));
      }
    }
  );

  server.registerTool(
    'update_post',
    {
      title: 'Update a blog post',
      description: `Update fields of an existing post in the "${TARGET}" database. Only provided fields change. If markdown is provided it is re-rendered.`,
      inputSchema: {
        slug: z.string().describe('Slug of the post to update.'),
        title: z.string().max(90).optional(),
        description: z.string().max(200).optional(),
        markdown: z.string().optional(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        series: z.string().optional(),
        heroVideo: z.string().optional(),
        cover: z.string().optional(),
        draft: z.boolean().optional(),
        featured: z.boolean().optional(),
        ...writeGuardShape,
      },
    },
    async (args) => {
      try {
        assertWritable(args);
        const [row] = await db.select().from(schema.posts).where(eq(schema.posts.slug, args.slug)).limit(1);
        if (!row) return fail(`No post with slug "${args.slug}".`);

        const patch: Record<string, unknown> = { updatedAt: new Date() };
        for (const k of ['title', 'description', 'tags', 'category', 'series', 'heroVideo', 'cover', 'draft', 'featured'] as const) {
          if (args[k] !== undefined) patch[k] = args[k];
        }
        if (args.markdown !== undefined) {
          const { html, headings } = await renderMarkdown(args.markdown);
          patch.bodyMarkdown = args.markdown;
          patch.bodyHtml = html;
          patch.readingTime = readingTime(args.markdown);
          patch.meta = { ...(row.meta as object), headings };
        }
        await db.update(schema.posts).set(patch).where(eq(schema.posts.slug, args.slug));
        return ok(`Updated post "${args.slug}" in "${TARGET}".`, { slug: args.slug, url: postUrl(args.slug) });
      } catch (e) {
        return fail(e instanceof Error ? e.message : String(e));
      }
    }
  );

  server.registerTool(
    'delete_post',
    {
      title: 'Delete a blog post',
      description: `Permanently delete a post from the "${TARGET}" database. This cannot be undone.`,
      inputSchema: { slug: z.string(), ...writeGuardShape },
    },
    async (args) => {
      try {
        assertWritable(args);
        const [row] = await db.select({ slug: schema.posts.slug }).from(schema.posts).where(eq(schema.posts.slug, args.slug)).limit(1);
        if (!row) return fail(`No post with slug "${args.slug}".`);
        await db.delete(schema.posts).where(and(eq(schema.posts.slug, args.slug)));
        return ok(`Deleted post "${args.slug}" from "${TARGET}".`, { slug: args.slug });
      } catch (e) {
        return fail(e instanceof Error ? e.message : String(e));
      }
    }
  );
}
