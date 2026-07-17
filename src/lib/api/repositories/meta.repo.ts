/**
 * Meta repository — skills & experience.
 * Skills: local fixture (no DB table — rarely changes, not worth it).
 * Experience: DB -> API -> local fixture, same precedence as projects/posts.
 */
import type { Skill, ExperienceItem } from '@lib/api/types';
import { API_ENABLED, apiGet } from '@lib/api/http';
import { dbEnabled, getDb, schema } from '@lib/db';
import { rowToExperience } from '@lib/db/mappers';
import { SKILLS } from '@data/skills';
import { EXPERIENCE } from '@data/experience';
import { desc } from 'drizzle-orm';

export async function getSkills(): Promise<Skill[]> {
  if (API_ENABLED) return apiGet<Skill[]>('/skills');
  return SKILLS;
}

export async function getExperience(): Promise<ExperienceItem[]> {
  if (dbEnabled()) {
    const rows = await getDb()
      .select()
      .from(schema.experience)
      .orderBy(desc(schema.experience.current), desc(schema.experience.startDate));
    return rows.map(rowToExperience);
  }
  if (API_ENABLED) return apiGet<ExperienceItem[]>('/experience');
  return EXPERIENCE;
}
