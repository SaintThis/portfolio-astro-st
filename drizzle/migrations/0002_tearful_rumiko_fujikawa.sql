CREATE TABLE "experience" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"role" text NOT NULL,
	"company" text NOT NULL,
	"period" text NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"location" text,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"current" boolean DEFAULT false NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "experience_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "experience_start_date_idx" ON "experience" USING btree ("start_date");