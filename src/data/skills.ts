import type { Skill } from '@lib/api/types';

export const SKILLS: Skill[] = [
  { name: 'React / Next.js', level: 92, category: 'frontend' },
  { name: 'TypeScript', level: 90, category: 'frontend' },
  { name: 'HTML5 / CSS3 / Tailwind', level: 88, category: 'frontend' },
  { name: 'Astro', level: 87, category: 'frontend' },
  { name: 'Deno / Fresh (Preact islands)', level: 72, category: 'frontend' },
  { name: 'Flutter', level: 60, category: 'frontend' },

  { name: 'Rust', level: 78, category: 'backend' },
  { name: 'Node.js', level: 85, category: 'backend' },
  { name: 'Django', level: 80, category: 'backend' },
  { name: 'PostgreSQL / MySQL', level: 82, category: 'backend' },

  { name: 'Microfrontend (MFE)', level: 85, category: 'architecture' },
  { name: 'Islands / Edge architecture', level: 82, category: 'architecture' },
  { name: 'SOLID / Clean Code', level: 88, category: 'architecture' },
  { name: 'RESTful API design', level: 86, category: 'architecture' },

  { name: 'Cloudflare Workers / R2', level: 80, category: 'devops' },
  { name: 'Docker', level: 78, category: 'devops' },
  { name: 'Git / CI-CD', level: 85, category: 'devops' },
];
