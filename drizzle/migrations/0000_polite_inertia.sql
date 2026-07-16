CREATE TABLE "post_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_slug" text NOT NULL,
	"visitor_hash" text NOT NULL,
	"day" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"draft" boolean DEFAULT false NOT NULL,
	"category" text,
	"series" text,
	"hero_video" text,
	"cover" text,
	"og_image" text,
	"featured" boolean DEFAULT false NOT NULL,
	"body_markdown" text DEFAULT '' NOT NULL,
	"body_html" text DEFAULT '' NOT NULL,
	"reading_time" integer DEFAULT 1 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"category" text NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'live' NOT NULL,
	"links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cover" text,
	"metrics" jsonb,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "post_views_unique_idx" ON "post_views" USING btree ("post_slug","visitor_hash","day");--> statement-breakpoint
CREATE INDEX "posts_date_idx" ON "posts" USING btree ("date");--> statement-breakpoint
CREATE INDEX "posts_draft_idx" ON "posts" USING btree ("draft");--> statement-breakpoint
CREATE INDEX "posts_category_idx" ON "posts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "projects_date_idx" ON "projects" USING btree ("date");--> statement-breakpoint
CREATE INDEX "projects_featured_idx" ON "projects" USING btree ("featured");