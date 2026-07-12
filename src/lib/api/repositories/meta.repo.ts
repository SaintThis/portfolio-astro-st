/**
 * Meta repository — skills & experience.
 * Same pattern: local fixtures now, API later.
 */
import type { Skill, ExperienceItem } from '@lib/api/types';
import { API_ENABLED, apiGet } from '@lib/api/http';
import { SKILLS } from '@data/skills';
import { EXPERIENCE } from '@data/experience';

export async function getSkills(): Promise<Skill[]> {
  if (API_ENABLED) return apiGet<Skill[]>('/skills');
  return SKILLS;
}

export async function getExperience(): Promise<ExperienceItem[]> {
  if (API_ENABLED) return apiGet<ExperienceItem[]>('/experience');
  return EXPERIENCE;
}
