/**
 * Shared helpers for the MCP tools: the write guard, response builders, and the
 * auto-categorizer.
 */
import { slugify } from '../src/lib/utils/format.ts';
import { TARGET } from './db.ts';

export { suggestCategory, CATEGORY_SLUGS } from '../src/lib/blog/categorize.ts';

/**
 * Write guard. Protects against accidental / unauthorized mutations, especially
 * against production:
 *  - When `MCP_WRITE_TOKEN` is set on the server (do this for the prod entry),
 *    every mutating call must pass a matching `writeToken` — a deliberate,
 *    human-supplied gate before anything reaches the live database.
 *  - When it's unset (local dev), writes are frictionless.
 * `confirm` must always be true, so an agent never writes without meaning to.
 */
export function assertWritable(args: { confirm?: boolean; writeToken?: string }) {
  if (args.confirm !== true) {
    throw new Error(
      `Refusing to write to the "${TARGET}" database without confirm: true. ` +
        `Set confirm: true only when the user has explicitly asked to save/publish.`
    );
  }
  const expected = process.env.MCP_WRITE_TOKEN;
  if (expected && args.writeToken !== expected) {
    throw new Error(
      `Writes to the "${TARGET}" database require a valid writeToken. ` +
        `Ask the user for it — do not guess.`
    );
  }
}

/** Standard success payload for a tool. */
export function ok(text: string, structuredContent?: Record<string, unknown>) {
  return {
    content: [{ type: 'text' as const, text }],
    ...(structuredContent ? { structuredContent } : {}),
  };
}

/** Standard error payload — surfaced to the model as an error result. */
export function fail(message: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
}

export function toSlug(input: string): string {
  return slugify(input);
}

