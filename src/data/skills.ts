import type { Skill } from '@lib/api/types';

export const SKILLS: Skill[] = [
  { name: 'React / Next.js', level: 92, category: 'frontend' },
  { name: 'TypeScript', level: 90, category: 'frontend' },
  { name: 'HTML5 / CSS3 / Tailwind', level: 88, category: 'frontend' },
  { name: 'Flutter', level: 60, category: 'frontend' },

  { name: 'Rust', level: 78, category: 'backend' },
  { name: 'Node.js', level: 85, category: 'backend' },
  { name: 'Django', level: 80, category: 'backend' },
  { name: 'PostgreSQL / MySQL', level: 82, category: 'backend' },

  { name: 'Microfrontend (MFE)', level: 85, category: 'architecture' },
  { name: 'SOLID / Clean Code', level: 88, category: 'architecture' },
  { name: 'RESTful API design', level: 86, category: 'architecture' },

  { name: 'Docker', level: 78, category: 'devops' },
  { name: 'Git / CI-CD', level: 85, category: 'devops' },
];
