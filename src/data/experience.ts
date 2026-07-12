import type { ExperienceItem } from '@lib/api/types';

export const EXPERIENCE: ExperienceItem[] = [
  {
    role: 'UI/UX Developer / Frontend Developer',
    company: 'CyTech International — Outsourced to NEC Software Philippines (NSP)',
    period: 'May 2026 – Present',
    current: true,
    highlights: [
      'UI/UX improvement for the Quality Cockpit (QC) system across multiple subsystems with a Japanese client team.',
      'Contribute via GitLab merge-request workflows across Maintenance, Benchmark, Search, Karte and Alert Email repos.',
      'Collaborate directly with NSP technical leadership on requirements and UI/UX standards.',
    ],
  },
  {
    role: 'Fullstack Developer',
    company: 'Confidential',
    period: 'Dec 2024 – May 2026',
    current: false,
    highlights: [
      'Architected and led a Microfrontend (MFE) system enabling independent deployments and long-term scalability.',
      'Built and maintained backend services with Rust and Django; integrated PostgreSQL & MySQL via Drizzle ORM.',
      'Reduced technical debt by 25% by introducing an agent-based coding workflow and leading code reviews.',
      "Designed and shipped 'Sniff & Detect', an Outlook extension automating tasks for 50+ employees.",
    ],
  },
  {
    role: 'Web Developer',
    company: 'Confidential',
    period: 'Feb 2024 – Dec 2024',
    current: false,
    highlights: [
      'Delivered features across the full SDLC for production apps, focused on API integration and performance.',
      "Enforced SOLID principles, OOP and Clean Code across the team's codebase through peer review.",
    ],
  },
  {
    role: 'Intern Web Developer',
    company: 'Confidential',
    period: 'Dec 2023 – Feb 2024',
    current: false,
    highlights: [
      'Assisted senior developers with debugging, testing and documentation on production workflows.',
    ],
  },
];
