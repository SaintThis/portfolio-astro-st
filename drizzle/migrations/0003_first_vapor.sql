CREATE TABLE "project_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_slug" text NOT NULL,
	"visitor_hash" text NOT NULL,
	"day" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "views" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "project_views_unique_idx" ON "project_views" USING btree ("project_slug","visitor_hash","day");