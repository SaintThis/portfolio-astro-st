/** DB barrel — import the client/flag from here, schema types from './schema'. */
export { getDb, dbEnabled, schema } from './client';
export type { ProjectRow, PostRow, NewProjectRow, NewPostRow } from './schema';
