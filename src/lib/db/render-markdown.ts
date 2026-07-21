/**
 * Markdown → HTML render step, used at WRITE time (seed / MCP / admin), never at
 * read time (except the Content-Collections fallback in posts.repo.ts, which
 * only runs when DATABASE_URL is unset). Posts store both the raw markdown
 * (for editing) and this rendered HTML snapshot (what the page displays), plus
 * the extracted headings for the table of contents — so reads are a single
 * cheap row fetch.
 *
 * IMPORTANT — this deliberately does NOT import `createMarkdownProcessor` from
 * `@astrojs/markdown-remark`, even with `syntaxHighlight: false`. That package's
 * main entry does `import { rehypeShiki } from './rehype-shiki.js'` at the top
 * of the file, UNCONDITIONALLY — `syntaxHighlight: false` only skips *calling*
 * it at runtime, it does not stop the bundler from including it (and everything
 * it imports: Shiki's full ~180-language bundled map, since `rehype-shiki.js`
 * imports Shiki's convenience `createHighlighter`, which must reference the
 * whole language map to resolve arbitrary string IDs). Confirmed empirically:
 * passing `syntaxHighlight: false` did not shrink the deployed Worker at all,
 * every one of Shiki's per-language chunks (`emacs-lisp`, `cpp`, `wolfram`,
 * `vue-vine`, `mdx`, `asciidoc`, `php`, `blade`, `swift`, `ruby`, `go`, dozens
 * more) was still there. That's what blew the Worker script past Cloudflare's
 * 3 MiB size limit — see `.claude/known-errors.md` for the incident.
 *
 * The actual fix: build the markdown→HTML pipeline directly from the same
 * underlying packages `@astrojs/markdown-remark` itself uses (remark-parse,
 * remark-gfm, remark-smartypants, remark-rehype, rehype-raw, rehype-stringify)
 * — never importing its main entry at all, so Shiki's map is never reachable
 * from this module's import graph — plus a hand-rolled heading-id plugin that
 * replicates its `rehype-collect-headings.js` (same `github-slugger` package,
 * same algorithm, MDX-only branches dropped since this project has no MDX)
 * so table-of-contents anchors keep matching exactly. Highlighting is then a
 * separate, explicit-import-only Shiki pass — see the bottom of this file.
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import GithubSlugger from 'github-slugger';
import type { Root as HastRoot, Element as HastElement } from 'hast';

import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript';
import githubDark from '@shikijs/themes/github-dark';
import astro from '@shikijs/langs/astro';
import bash from '@shikijs/langs/bash';
import css from '@shikijs/langs/css';
import diffLang from '@shikijs/langs/diff';
import html from '@shikijs/langs/html';
import javascript from '@shikijs/langs/javascript';
import json from '@shikijs/langs/json';
import jsx from '@shikijs/langs/jsx';
import python from '@shikijs/langs/python';
import rust from '@shikijs/langs/rust';
import sql from '@shikijs/langs/sql';
import typescript from '@shikijs/langs/typescript';
import tsx from '@shikijs/langs/tsx';
import yaml from '@shikijs/langs/yaml';

export interface MarkdownHeading {
  depth: number;
  slug: string;
  text: string;
}

export interface RenderedMarkdown {
  html: string;
  headings: MarkdownHeading[];
}

/**
 * Minimal reimplementation of @astrojs/markdown-remark's rehype-collect-headings.js
 * for plain (non-MDX) markdown — same `github-slugger` package, same text-
 * accumulation rule, so generated ids match what the Content-Collections path
 * (which does use the real Astro pipeline, at build time only — no bundle-size
 * concern there) would have produced for identical heading text.
 */
function collectHeadings() {
  return (tree: HastRoot, collected: MarkdownHeading[]) => {
    const slugger = new GithubSlugger();
    visit(tree, (node) => {
      if (node.type !== 'element') return;
      const el = node as HastElement;
      const match = /^h([1-6])$/.exec(el.tagName);
      if (!match) return;
      const depth = Number(match[1]);
      let text = '';
      visit(el, (child: any, _index: number | undefined, parent: any) => {
        if (child.type === 'element' || parent == null) return;
        if (child.type === 'raw' && /^\n?<.*>\n?$/.test(child.value)) return;
        if (child.type === 'text' || child.type === 'raw') {
          text += child.value.replace(/\{/g, '${');
        }
      });
      el.properties = el.properties || {};
      if (typeof el.properties.id !== 'string') {
        el.properties.id = slugger.slug(text);
      }
      collected.push({ depth, slug: el.properties.id as string, text });
    });
  };
}

let _highlighter: HighlighterCore | null = null;
async function highlighter() {
  _highlighter ??= await createHighlighterCore({
    themes: [githubDark],
    langs: [astro, bash, css, diffLang, html, javascript, json, jsx, python, rust, sql, typescript, tsx, yaml],
    engine: createJavaScriptRegexEngine(),
  });
  return _highlighter;
}

const CODE_BLOCK_RE = /<pre><code class="language-([\w-]+)">([\s\S]*?)<\/code><\/pre>/g;

// Minimal entity decode for the handful remark-rehype actually emits.
// Order matters: decode `&amp;` last, or `&amp;lt;` would wrongly become `<`.
function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

async function highlightCodeBlocks(html: string): Promise<string> {
  const hl = await highlighter();
  const loaded = new Set(hl.getLoadedLanguages());
  let out = html;
  for (const match of html.matchAll(CODE_BLOCK_RE)) {
    const [full, lang, rawCode] = match;
    if (!loaded.has(lang)) continue; // outside our fixed set — leave as plain <pre><code>
    try {
      const decoded = decodeEntities(rawCode).replace(/\n$/, '');
      out = out.replace(full, hl.codeToHtml(decoded, { lang, theme: 'github-dark' }));
    } catch {
      // malformed fence content — leave the plain block rather than fail the save
    }
  }
  return out;
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const headings: MarkdownHeading[] = [];

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkSmartypants)
    .use(remarkRehype, { allowDangerousHtml: true, passThrough: [] })
    .use(() => (tree: HastRoot) => collectHeadings()(tree, headings))
    .use(rehypeRaw)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  const html = await highlightCodeBlocks(String(file));
  return { html, headings };
}
