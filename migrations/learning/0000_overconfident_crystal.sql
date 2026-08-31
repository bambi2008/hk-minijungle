CREATE TABLE "fivecrop_learning_cases" (
	"sequence" bigserial PRIMARY KEY NOT NULL,
	"id" uuid NOT NULL,
	"owner_hash" varchar(64) NOT NULL,
	"digest" varchar(64) NOT NULL,
	"crop_key" varchar(20) NOT NULL,
	"snapshot" jsonb NOT NULL,
	"photo" jsonb NOT NULL,
	"photo_ready" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "fivecrop_learning_cases_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "fivecrop_learning_events" (
	"sequence" bigserial PRIMARY KEY NOT NULL,
	"id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"digest" varchar(64) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"payload" jsonb NOT NULL,
	"photo_ready" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fivecrop_learning_events_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "fivecrop_learning_limits" (
	"bucket" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fivecrop_learning_events" ADD CONSTRAINT "fivecrop_learning_events_case_id_fivecrop_learning_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."fivecrop_learning_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fivecrop_learning_owner_sequence" ON "fivecrop_learning_cases" USING btree ("owner_hash","sequence");--> statement-breakpoint
CREATE INDEX "fivecrop_learning_case_events" ON "fivecrop_learning_events" USING btree ("case_id","sequence");