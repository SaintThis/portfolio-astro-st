/**
 * Portfolio content MCP server (stdio).
 *
 * Exposes CRUD tools over the projects + posts tables so an MCP-capable Claude
 * (Claude Desktop, Claude Code, …) can manage site content by prompting. The
 * database it targets is set by the DATABASE_URL of the `.mcp.json` entry that
 * launched it — register one entry per environment (local / prod).
 *
 * Structured so it can later be fronted by an HTTP transport for a remote
 * connector without touching the tool logic (see mcp-server/README.md).
 *
 * Run: tsx mcp-server/index.ts   (normally launched by an MCP client, not by hand)
 */
import './env.ts'; // must be first — loads env before db.ts reads it
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TARGET } from './db.ts';
import { registerPostTools } from './tools/posts.ts';
import { registerProjectTools } from './tools/projects.ts';
import { registerExperienceTools } from './tools/experience.ts';

async function main() {
  const server = new McpServer({ name: 'portfolio-content', version: '1.0.0' });

  registerPostTools(server);
  registerProjectTools(server);
  registerExperienceTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr is safe for logs on stdio transport (stdout carries the protocol).
  console.error(`[portfolio-content MCP] connected — target database: "${TARGET}"`);
}

main().catch((err) => {
  console.error('[portfolio-content MCP] fatal:', err);
  process.exit(1);
});
