/**
 * Blog auto-categorizer. Shared by the seed script, the MCP server, and any
 * future admin "suggest" affordance — one keyword-scoring heuristic that maps
 * post text onto a `BLOG.categories` slug. Deliberately dependency-light and
 * alias-free so it imports cleanly from both the Astro app and standalone Node
 * (tsx) scripts.
 */
import { BLOG } from '../../config';

export const CATEGORY_SLUGS = BLOG.categories.map((c) => c.slug);

const SYNONYMS: Record<string, string[]> = {
  engineering: ['engineering', 'scalab', 'infrastructure', 'deploy', 'pipeline', 'ci/cd', 'observability', 'system'],
  architecture: ['architecture', 'design pattern', 'microservice', 'microfrontend', 'monolith', 'module federation', 'boundaries', 'coupling'],
  frontend: ['frontend', 'react', 'css', ' ui ', ' ux ', 'browser', 'astro', 'vue', 'svelte', 'tailwind', 'component', 'accessibility', 'typescript'],
  backend: ['backend', ' api ', 'database', ' sql', 'postgres', 'server', 'node', 'django', 'auth', ' orm', 'drizzle', 'data fetching'],
  rust: ['rust', 'cargo', 'wasm', 'borrow checker', 'memory safety', 'ownership'],
  career: ['career', 'interview', 'hiring', 'resume', 'productivity', 'soft skill', 'mentor', 'antipattern', 'best practice'],
};

export function suggestCategory(text: string): string | null {
  const hay = ` ${text.toLowerCase()} `;
  let best: string | null = null;
  let bestScore = 0;
  for (const c of BLOG.categories) {
    const keys = SYNONYMS[c.slug] ?? [c.slug, c.label.toLowerCase()];
    let score = 0;
    for (const k of keys) score += hay.split(k).length - 1;
    if (score > bestScore) {
      bestScore = score;
      best = c.slug;
    }
  }
  return bestScore > 0 ? best : null;
}
