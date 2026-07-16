/**
 * Project CRUD tools. Projects have no markdown body, so these are plain row
 * writes mapped onto the `projects` table.
 */
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db, schema, TARGET } from '../db.ts';
import { SITE } from '../../src/config.ts';
import { assertWritable, fail, ok, toSlug } from '../util.ts';

const writeGuardShape = {
  confirm: z.boolean().default(false).describe('Must be true to write. Set only when the user explicitly asked to save/publish.'),
  writeToken: z.string().optional().describe('Required only when the target server has MCP_WRITE_TOKEN set (e.g. production).'),
};

const CATEGORIES = ['web', 'backend', 'tooling', 'mobile', 'experiment'] as const;
const STATUSES = ['live', 'wip', 'archived'] as const;
const projUrl = (slug: string) => new URL(`/projects/${slug}`, SITE.url).toString();

export function registerProjectTools(server: McpServer) {
  server.registerTool(
    'list_projects',
    {
      title: 'List projects',
      description: `List all projects in the "${TARGET}" database (newest first).`,
      inputSchema: {},
    },
    async () => {
      const rows = await db
        .select({
          slug: schema.projects.slug,
          title: schema.projects.title,
          category: schema.projects.category,
          status: schema.projects.status,
          featured: schema.projects.featured,
          date: schema.projects.date,
        })
        .from(schema.projects)
        .orderBy(desc(schema.projects.date));
      return ok(`${rows.length} project(s) in "${TARGET}":\n` + JSON.stringify(rows, null, 2), { projects: rows });
    }
  );

  server.registerTool(
    'get_project',
    {
      title: 'Get a project',
      description: `Fetch one project from the "${TARGET}" database by slug.`,
      inputSchema: { slug: z.string() },
    },
    async ({ slug }) => {
      const [row] = await db.select().from(schema.projects).where(eq(schema.projects.slug, slug)).limit(1);
      if (!row) return fail(`No project with slug "${slug}".`);
      return ok(JSON.stringify(row, null, 2), { project: row });
    }
  );

  server.registerTool(
    'create_project',
    {
      title: 'Create a project',
      description: `Create a project in the "${TARGET}" database. Live immediately on the site.`,
      inputSchema: {
        title: z.string(),
        summary: z.string(),
        description: z.string().default(''),
        slug: z.string().optional(),
        tags: z.array(z.string()).default([]),
        category: z.enum(CATEGORIES),
        status: z.enum(STATUSES).default('live'),
        date: z.string().optional().describe('ISO date; defaults to now.'),
        featured: z.boolean().default(false),
        links: z.record(z.string(), z.string()).default({}).describe('e.g. { live, repo, caseStudy }'),
        cover: z.string().optional(),
        metrics: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
        ...writeGuardShape,
      },
    },
    async (args) => {
      try {
        assertWritable(args);
        const slug = toSlug(args.slug || args.title);
        const [existing] = await db.select({ slug: schema.projects.slug }).from(schema.projects).where(eq(schema.projects.slug, slug)).limit(1);
        if (existing) return fail(`A project with slug "${slug}" already exists. Use update_project.`);

        await db.insert(schema.projects).values({
          slug,
          title: args.title,
          summary: args.summary,
          description: args.description,
          tags: args.tags,
          category: args.category,
          status: args.status,
          date: args.date ? new Date(args.date) : new Date(),
          featured: args.featured,
          links: args.links,
          cover: args.cover ?? null,
          metrics: args.metrics ?? null,
          updatedAt: new Date(),
        });
        return ok(`Created project "${slug}" in "${TARGET}" — ${projUrl(slug)}.`, { slug, url: projUrl(slug) });
      } catch (e) {
        return fail(e instanceof Error ? e.message : String(e));
      }
    }
  );

  server.registerTool(
    'update_project',
    {
      title: 'Update a project',
      description: `Update fields of an existing project in the "${TARGET}" database. Only provided fields change.`,
      inputSchema: {
        slug: z.string(),
        title: z.string().optional(),
        summary: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        category: z.enum(CATEGORIES).optional(),
        status: z.enum(STATUSES).optional(),
        featured: z.boolean().optional(),
        links: z.record(z.string(), z.string()).optional(),
        cover: z.string().optional(),
        metrics: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
        ...writeGuardShape,
      },
    },
    async (args) => {
      try {
        assertWritable(args);
        const [row] = await db.select({ slug: schema.projects.slug }).from(schema.projects).where(eq(schema.projects.slug, args.slug)).limit(1);
        if (!row) return fail(`No project with slug "${args.slug}".`);
        const patch: Record<string, unknown> = { updatedAt: new Date() };
        for (const k of ['title', 'summary', 'description', 'tags', 'category', 'status', 'featured', 'links', 'cover', 'metrics'] as const) {
          if (args[k] !== undefined) patch[k] = args[k];
        }
        await db.update(schema.projects).set(patch).where(eq(schema.projects.slug, args.slug));
        return ok(`Updated project "${args.slug}" in "${TARGET}".`, { slug: args.slug, url: projUrl(args.slug) });
      } catch (e) {
        return fail(e instanceof Error ? e.message : String(e));
      }
    }
  );

  server.registerTool(
    'delete_project',
    {
      title: 'Delete a project',
      description: `Permanently delete a project from the "${TARGET}" database. Cannot be undone.`,
      inputSchema: { slug: z.string(), ...writeGuardShape },
    },
    async (args) => {
      try {
        assertWritable(args);
        const [row] = await db.select({ slug: schema.projects.slug }).from(schema.projects).where(eq(schema.projects.slug, args.slug)).limit(1);
        if (!row) return fail(`No project with slug "${args.slug}".`);
        await db.delete(schema.projects).where(and(eq(schema.projects.slug, args.slug)));
        return ok(`Deleted project "${args.slug}" from "${TARGET}".`, { slug: args.slug });
      } catch (e) {
        return fail(e instanceof Error ? e.message : String(e));
      }
    }
  );
}
