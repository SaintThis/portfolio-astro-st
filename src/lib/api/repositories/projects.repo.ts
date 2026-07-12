/**
 * Projects repository — the ONLY place that knows where projects come from.
 *
 * Today: returns local example data (src/data/projects.ts).
 * Tomorrow: set PUBLIC_API_BASE_URL and replace the `API_ENABLED` branch bodies
 * with `apiGet(...)` calls that map the response into `Project`. Components and
 * pages call these functions and never change.
 */
import type { Project } from '@lib/api/types';
import { API_ENABLED, apiGet } from '@lib/api/http';
import { PROJECTS } from '@data/projects';

export async function getProjects(): Promise<Project[]> {
  if (API_ENABLED) {
    // return (await apiGet<Project[]>('/projects')).map(normalize);
    return apiGet<Project[]>('/projects');
  }
  return [...PROJECTS].sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export async function getFeaturedProjects(limit = 3): Promise<Project[]> {
  const all = await getProjects();
  return all.filter((p) => p.featured).slice(0, limit);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  if (API_ENABLED) {
    return apiGet<Project>(`/projects/${slug}`).catch(() => undefined);
  }
  return PROJECTS.find((p) => p.slug === slug);
}

export async function getProjectCategories(): Promise<string[]> {
  const all = await getProjects();
  return Array.from(new Set(all.map((p) => p.category)));
}
