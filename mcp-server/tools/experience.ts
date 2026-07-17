/**
 * Experience (work history) CRUD tools. Small table (a handful of rows), no
 * markdown body — plain row writes mapped onto the `experience` table.
 */
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db, schema, TARGET } from '../db.ts';
import { assertWritable, fail, ok, toSlug } from '../util.ts';

const writeGuardShape = {
  confirm: z.boolean().default(false).describe('Must be true to write. Set only when the user explicitly asked to save/publish.'),
  writeToken: z.string().optional().describe('Required only when the target server has MCP_WRITE_TOKEN set (e.g. production).'),
};

function parseStartDate(period: string): Date {
  const match = period.match(/([A-Za-z]{3,9})\s+(\d{4})/);
  if (!match) return new Date();
  const parsed = new Date(`${match[1]} 1, ${match[2]}`);
  return isNaN(+parsed) ? new Date() : parsed;
}

export function registerExperienceTools(server: McpServer) {
  server.registerTool(
    'list_experience',
    {
      title: 'List work experience',
      description: `List all work-experience entries in the "${TARGET}" database, newest/current first.`,
      inputSchema: {},
    },
    async () => {
      const rows = await db
        .select()
        .from(schema.experience)
        .orderBy(desc(schema.experience.current), desc(schema.experience.startDate));
      return ok(`${rows.length} experience entr(y/ies) in "${TARGET}":\n` + JSON.stringify(rows, null, 2), { experience: rows });
    }
  );

  server.registerTool(
    'get_experience',
    {
      title: 'Get a work experience entry',
      description: `Fetch one experience entry from the "${TARGET}" database by slug.`,
      inputSchema: { slug: z.string() },
    },
    async ({ slug }) => {
      const [row] = await db.select().from(schema.experience).where(eq(schema.experience.slug, slug)).limit(1);
      if (!row) return fail(`No experience entry with slug "${slug}".`);
      return ok(JSON.stringify(row, null, 2), { experience: row });
    }
  );

  server.registerTool(
    'create_experience',
    {
      title: 'Create a work experience entry',
      description:
        `Add a work-experience entry to the "${TARGET}" database. The About page reads this list live — ` +
        `changes appear with no rebuild. Set current:true for your present role (it sorts to the top).`,
      inputSchema: {
        role: z.string(),
        company: z.string(),
        period: z.string().describe('Free-text display label, e.g. "May 2026 – Present".'),
        location: z.string().optional(),
        highlights: z.array(z.string()).default([]),
        current: z.boolean().default(false),
        slug: z.string().optional().describe('Defaults to a slug derived from role + company.'),
        ...writeGuardShape,
      },
    },
    async (args) => {
      try {
        assertWritable(args);
        const slug = toSlug(args.slug || `${args.role}-${args.company}`);
        const [existing] = await db.select({ slug: schema.experience.slug }).from(schema.experience).where(eq(schema.experience.slug, slug)).limit(1);
        if (existing) return fail(`An experience entry with slug "${slug}" already exists. Use update_experience.`);

        await db.insert(schema.experience).values({
          slug,
          role: args.role,
          company: args.company,
          period: args.period,
          startDate: parseStartDate(args.period),
          location: args.location ?? null,
          highlights: args.highlights,
          current: args.current,
          updatedAt: new Date(),
        });
        return ok(`Created experience entry "${slug}" in "${TARGET}".`, { slug });
      } catch (e) {
        return fail(e instanceof Error ? e.message : String(e));
      }
    }
  );

  server.registerTool(
    'update_experience',
    {
      title: 'Update a work experience entry',
      description: `Update fields of an existing experience entry in the "${TARGET}" database. Only provided fields change.`,
      inputSchema: {
        slug: z.string(),
        role: z.string().optional(),
        company: z.string().optional(),
        period: z.string().optional(),
        location: z.string().optional(),
        highlights: z.array(z.string()).optional(),
        current: z.boolean().optional(),
        ...writeGuardShape,
      },
    },
    async (args) => {
      try {
        assertWritable(args);
        const [row] = await db.select().from(schema.experience).where(eq(schema.experience.slug, args.slug)).limit(1);
        if (!row) return fail(`No experience entry with slug "${args.slug}".`);

        const patch: Record<string, unknown> = { updatedAt: new Date() };
        for (const k of ['role', 'company', 'location', 'highlights', 'current'] as const) {
          if (args[k] !== undefined) patch[k] = args[k];
        }
        if (args.period !== undefined) {
          patch.period = args.period;
          patch.startDate = parseStartDate(args.period);
        }
        await db.update(schema.experience).set(patch).where(eq(schema.experience.slug, args.slug));
        return ok(`Updated experience entry "${args.slug}" in "${TARGET}".`, { slug: args.slug });
      } catch (e) {
        return fail(e instanceof Error ? e.message : String(e));
      }
    }
  );

  server.registerTool(
    'delete_experience',
    {
      title: 'Delete a work experience entry',
      description: `Permanently delete an experience entry from the "${TARGET}" database. Cannot be undone.`,
      inputSchema: { slug: z.string(), ...writeGuardShape },
    },
    async (args) => {
      try {
        assertWritable(args);
        const [row] = await db.select({ slug: schema.experience.slug }).from(schema.experience).where(eq(schema.experience.slug, args.slug)).limit(1);
        if (!row) return fail(`No experience entry with slug "${args.slug}".`);
        await db.delete(schema.experience).where(eq(schema.experience.slug, args.slug));
        return ok(`Deleted experience entry "${args.slug}" from "${TARGET}".`, { slug: args.slug });
      } catch (e) {
        return fail(e instanceof Error ? e.message : String(e));
      }
    }
  );
}
