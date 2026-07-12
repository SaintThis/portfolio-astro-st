/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_API_BASE_URL: string;
  readonly CONTACT_FORM_ENDPOINT?: string;
  readonly API_SECRET_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  /** Shape of `Astro.locals` — populated in src/middleware.ts. */
  interface Locals {
    requestId: string;
    startedAt: number;
    // user?: { id: string; name: string } | null;
  }
}
