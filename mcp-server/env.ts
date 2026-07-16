/**
 * Loads environment for the MCP server BEFORE any module reads process.env.
 * Must be the first import in index.ts (ESM runs imported modules in order, so
 * this side effect happens before db.ts reads DATABASE_URL).
 *
 * `MCP_ENV_FILE` selects which env file to load — default `.env` (dev). The prod
 * .mcp entry sets MCP_ENV_FILE=.env.production so the production connection
 * string never has to live in a committed config file.
 */
import dotenv from 'dotenv';

dotenv.config({ path: process.env.MCP_ENV_FILE || '.env' });
