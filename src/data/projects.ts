import type { Project } from '@lib/api/types';

/**
 * EXAMPLE DATA — replace with real API results later.
 *
 * When your backend is ready, you do NOT touch components: you only swap the
 * body of `src/lib/api/repositories/projects.repo.ts` to fetch from the API.
 * Keep this file as a typed fixture / offline fallback.
 */
export const PROJECTS: Project[] = [
  {
    slug: 'microfrontend-platform',
    title: 'Microfrontend Platform',
    summary: 'MFE architecture enabling independent team deployments for a core product.',
    description:
      'Architected and led development of a Microfrontend (MFE) system for a core company product. Split a monolith into independently deployable remotes, standardized a shared design-system contract, and set up module federation so teams ship on their own cadence without full-app redeploys.',
    tags: ['React', 'TypeScript', 'Module Federation', 'Vite', 'Design System'],
    category: 'web',
    date: '2025-08-01',
    featured: true,
    status: 'live',
    links: { caseStudy: '/projects/microfrontend-platform' },
    metrics: [
      { label: 'Deploy independence', value: '100%' },
      { label: 'Tech debt reduced', value: '25%' },
    ],
  },
  {
    slug: 'sniff-and-detect',
    title: 'Sniff & Detect',
    summary: 'Outlook extension that automated recurring workflow tasks for 50+ employees.',
    description:
      'Designed and shipped an Outlook add-in that detects recurring email patterns and automates repetitive triage/routing tasks. Rolled out to 50+ employees, cutting manual handling time on daily workflows.',
    tags: ['TypeScript', 'Office.js', 'Automation'],
    category: 'tooling',
    date: '2025-03-10',
    featured: true,
    status: 'live',
    links: {},
    metrics: [{ label: 'Employees served', value: '50+' }],
  },
  {
    slug: 'quality-cockpit-ui',
    title: 'Quality Cockpit — UI/UX',
    summary: 'UI/UX improvements across Maintenance, Benchmark, Search, Karte & Alert subsystems.',
    description:
      'Contributing UI/UX improvements to the Quality Cockpit (QC) system for a Japanese client team, working across multiple subsystems through GitLab merge-request workflows and collaborating directly with the client’s technical leadership on standards.',
    tags: ['React', 'TypeScript', 'UI/UX', 'GitLab CI'],
    category: 'web',
    date: '2026-06-01',
    featured: false,
    status: 'wip',
    links: {},
  },
  {
    slug: 'rust-django-services',
    title: 'Backend Services (Rust + Django)',
    summary: 'Production backend services with PostgreSQL & MySQL via Drizzle ORM.',
    description:
      'Built and maintained backend services in Rust and Django, integrating PostgreSQL and MySQL through Drizzle ORM, with Docker-based local environments and CI for reliable delivery.',
    tags: ['Rust', 'Django', 'PostgreSQL', 'MySQL', 'Docker'],
    category: 'backend',
    date: '2025-05-01',
    featured: true,
    status: 'live',
    links: {},
  },
  {
    slug: 'portfolio-astro-st',
    title: 'This Portfolio',
    summary: 'The site you are on — Astro islands, GSAP, multi-theme, API-ready.',
    description:
      'A performance-first, SEO-friendly portfolio built with Astro’s islands architecture, React islands for interactivity, GSAP + Motion for animation, and a repository layer ready to swap example data for a real API.',
    tags: ['Astro', 'React', 'Tailwind', 'GSAP', 'Zustand'],
    category: 'experiment',
    date: '2026-07-12',
    featured: false,
    status: 'live',
    links: { repo: 'https://github.com/SaintThis/portfolio-astro-st' },
  },
];
