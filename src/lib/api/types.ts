/**
 * Domain types — the shape your UI depends on.
 *
 * These are deliberately decoupled from any storage/transport. Whether a project
 * comes from a local array today or a REST/GraphQL API tomorrow, it must be
 * mapped into these types before it reaches a component. That's the seam that
 * makes swapping the backend a one-file change (see ./repositories).
 */

export interface Project {
  slug: string;
  title: string;
  summary: string;
  description: string;
  /** Tech stack tags, e.g. ['Astro', 'Rust', 'PostgreSQL']. */
  tags: string[];
  category: 'web' | 'backend' | 'tooling' | 'mobile' | 'experiment';
  /** ISO date the project shipped / was last worked on. */
  date: string;
  featured: boolean;
  status: 'live' | 'wip' | 'archived';
  links: {
    live?: string;
    repo?: string;
    caseStudy?: string;
  };
  /** Path under /public or a remote URL. */
  cover?: string;
  /** Optional headline metrics for the case study. */
  metrics?: { label: string; value: string }[];
}

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  tags: string[];
  draft: boolean;
  readingTime: number;
  cover?: string;
  /** Primary category — drives the blog index filter chips. */
  category?: string;
}

/**
 * A full blog post — `PostMeta` plus the rendered body and the extra reading-UI
 * fields. Returned by `getPost(slug)`; list endpoints return `PostMeta`. Extends
 * PostMeta additively so summary consumers keep working unchanged.
 */
export interface PostFull extends PostMeta {
  /** Pre-rendered HTML (rendered at write time). */
  bodyHtml: string;
  /** Raw markdown source — for editing/re-rendering. */
  bodyMarkdown: string;
  category?: string;
  series?: string;
  heroVideo?: string;
  ogImage?: string;
  featured?: boolean;
  /** Lifetime view count (0 until the view-tracking backend is live). */
  views?: number;
  /** Extracted {depth, slug, text} for the table of contents. */
  headings?: { depth: number; slug: string; text: string }[];
}

export interface Skill {
  name: string;
  level: number; // 0–100 for the bar meters
  category: 'frontend' | 'backend' | 'architecture' | 'devops';
}

export interface ExperienceItem {
  role: string;
  company: string;
  period: string;
  location?: string;
  highlights: string[];
  current: boolean;
}

/** Standard envelope so pagination/errors stay consistent across sources. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
