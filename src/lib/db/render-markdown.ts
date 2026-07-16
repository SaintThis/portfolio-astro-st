/**
 * Markdown → HTML render step, used at WRITE time (seed / MCP / admin), never at
 * read time. Posts store both the raw markdown (for editing) and this rendered
 * HTML snapshot (what the page displays), plus the extracted headings for the
 * table of contents — so reads are a single cheap row fetch.
 *
 * Uses Astro's own processor (`@astrojs/markdown-remark`) so DB-backed posts
 * render identically to the Content-Collections ones: same shiki highlighting,
 * same auto-generated heading ids that the TOC anchors point at.
 */
import { createMarkdownProcessor, type MarkdownHeading } from '@astrojs/markdown-remark';

let _processor: Awaited<ReturnType<typeof createMarkdownProcessor>> | null = null;

async function processor() {
  _processor ??= await createMarkdownProcessor({ gfm: true, smartypants: true });
  return _processor;
}

export interface RenderedMarkdown {
  html: string;
  headings: MarkdownHeading[];
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const { code, metadata } = await (await processor()).render(markdown);
  return { html: code, headings: metadata.headings };
}
