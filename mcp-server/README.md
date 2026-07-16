# Portfolio content MCP server

A local [MCP](https://modelcontextprotocol.io) server that lets an MCP-capable
Claude (Claude Desktop, Claude Code, …) manage this site's **projects and blog
posts** by prompting — create, update, delete, list. Writes go straight to
Postgres, and because the site reads the DB at request time, changes are **live
with no rebuild**.

## Tools

Posts: `list_posts`, `get_post`, `create_post`, `update_post`, `delete_post`
Projects: `list_projects`, `get_project`, `create_project`, `update_project`, `delete_project`

`create_post` takes the body as **markdown** and renders it (syntax highlighting
+ table of contents) at write time. If you omit `category`, it's **auto-assigned**
from the allowed list in `src/config.ts` (`BLOG.categories`).

## The local / prod split

Two servers are registered in [`.mcp.json`](../.mcp.json). They run the same
code; only the target database differs, chosen by an env file — **no secrets are
stored in `.mcp.json`**:

| Server | `MCP_TARGET` | Loads | Writes to |
| --- | --- | --- | --- |
| `portfolio-content-local` | `local` | `.env` | your dev database |
| `portfolio-content-prod` | `prod` | `.env.production` | your **production** database |

To publish to production you call the tool on the **`portfolio-content-prod`**
server — a deliberate choice of target, not a flag.

## Safety: the write guard

Every mutating tool requires `confirm: true` (so an agent never writes by
accident). Additionally, if the target env file sets **`MCP_WRITE_TOKEN`**, every
write must also pass a matching `writeToken`. Recommended: put a token in
`.env.production` only —

```
# .env.production  (gitignored)
DATABASE_URL="postgres://…prod…"
MCP_WRITE_TOKEN="some-long-random-string"
```

— so production writes need a secret you supply in chat, while local edits stay
frictionless.

## Using it

1. Open a client that reads this project's `.mcp.json` (Claude Code in this repo,
   or add these servers to Claude Desktop).
2. Prompt, e.g. *"Add a blog post titled … with this content: …"* → the agent
   calls `create_post` on the local server. Review it on `npm run dev`.
3. When happy, ask it to create the same post on the **prod** server (it'll need
   the `writeToken` if you set one).

Requires `.env` (dev `DATABASE_URL`) to exist; for prod, `.env.production`.

## Remote later

The tool logic in `tools/*.ts` is transport-agnostic. To expose this as a remote
[connector](https://modelcontextprotocol.io) for claude.ai, front the same
`registerPostTools` / `registerProjectTools` with the SDK's HTTP transport and
add auth — no tool changes needed.
