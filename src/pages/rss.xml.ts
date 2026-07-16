import rss from '@astrojs/rss';
import { SITE } from '@/config';
import { getPosts } from '@lib/api';
import type { APIContext } from 'astro';

// Request-time so posts added via the DB (MCP/admin) show up without a rebuild.
export const prerender = false;

export async function GET(context: APIContext) {
  const posts = await getPosts(); // repo already filters drafts + sorts newest-first

  return rss({
    title: `${SITE.name} — Blog`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      pubDate: new Date(post.date),
      link: `/blog/${post.slug}/`,
      categories: post.tags,
    })),
    customData: `<language>${SITE.locale}</language>`,
  });
}
