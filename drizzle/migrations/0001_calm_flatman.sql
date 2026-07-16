DROP INDEX "post_views_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "post_views_unique_idx" ON "post_views" USING btree ("post_slug","visitor_hash","day");