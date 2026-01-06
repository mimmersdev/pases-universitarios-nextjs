CREATE TYPE "public"."installation_status" AS ENUM('Pending', 'Installed');--> statement-breakpoint
CREATE TYPE "public"."pass_status" AS ENUM('Active', 'Inactive');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('Due', 'Overdue', 'Paid');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('Active', 'Inactive', 'Graduated');--> statement-breakpoint
CREATE TYPE "public"."tag_type" AS ENUM('numeric', 'date', 'boolean', 'list');--> statement-breakpoint
CREATE TABLE "apple_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unique_identifier" text NOT NULL,
	"career_id" text NOT NULL,
	"university_id" uuid NOT NULL,
	"device_library_identifier" text NOT NULL,
	"pass_type_identifier" text NOT NULL,
	"push_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_apple_devices" UNIQUE("unique_identifier","career_id","university_id","device_library_identifier","pass_type_identifier","push_token")
);
--> statement-breakpoint
CREATE TABLE "boolean_tags" (
	"unique_identifier" text NOT NULL,
	"career_id" text NOT NULL,
	"university_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"value" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "boolean_tags_unique_identifier_career_id_university_id_tag_id_pk" PRIMARY KEY("unique_identifier","career_id","university_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "careers" (
	"code" text NOT NULL,
	"university_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "careers_code_university_id_pk" PRIMARY KEY("code","university_id")
);
--> statement-breakpoint
CREATE TABLE "config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_wallet_class_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "date_tags" (
	"unique_identifier" text NOT NULL,
	"career_id" text NOT NULL,
	"university_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"value" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "date_tags_unique_identifier_career_id_university_id_tag_id_pk" PRIMARY KEY("unique_identifier","career_id","university_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "list_tags" (
	"unique_identifier" text NOT NULL,
	"career_id" text NOT NULL,
	"university_id" uuid NOT NULL,
	"tag_option_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "list_tags_unique_identifier_career_id_university_id_tag_option_id_pk" PRIMARY KEY("unique_identifier","career_id","university_id","tag_option_id")
);
--> statement-breakpoint
CREATE TABLE "list_tags_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_id" uuid NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "numeric_tags" (
	"unique_identifier" text NOT NULL,
	"career_id" text NOT NULL,
	"university_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"value" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "numeric_tags_unique_identifier_career_id_university_id_tag_id_pk" PRIMARY KEY("unique_identifier","career_id","university_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "pass_updates" (
	"unique_identifier" text NOT NULL,
	"career_id" text NOT NULL,
	"university_id" uuid NOT NULL,
	"total_to_pay" numeric NOT NULL,
	"cashback" numeric NOT NULL,
	"end_due_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pass_updates_unique_identifier_career_id_university_id_pk" PRIMARY KEY("unique_identifier","career_id","university_id")
);
--> statement-breakpoint
CREATE TABLE "passes" (
	"unique_identifier" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"university_id" uuid NOT NULL,
	"career_id" text NOT NULL,
	"semester" integer NOT NULL,
	"enrollment_year" integer NOT NULL,
	"payment_reference" text NOT NULL,
	"payment_status" "payment_status" NOT NULL,
	"pass_status" "pass_status" NOT NULL,
	"total_to_pay" numeric NOT NULL,
	"start_due_date" timestamp with time zone NOT NULL,
	"end_due_date" timestamp with time zone NOT NULL,
	"cashback" numeric NOT NULL,
	"student_status" "student_status" NOT NULL,
	"online_payment_url" text,
	"academic_calendar_url" text,
	"google_wallet_object_id" text,
	"apple_wallet_serial_number" text,
	"google_installation_status" "installation_status" DEFAULT 'Pending' NOT NULL,
	"apple_installation_status" "installation_status" DEFAULT 'Pending' NOT NULL,
	"notification_count" integer DEFAULT 0 NOT NULL,
	"last_notification_date" timestamp with time zone,
	"information_field" text DEFAULT '' NOT NULL,
	"photo1_url" text NOT NULL,
	"photo2_url" text NOT NULL,
	"photo3_url" text NOT NULL,
	"photo_google_hero_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "passes_unique_identifier_career_id_university_id_pk" PRIMARY KEY("unique_identifier","career_id","university_id"),
	CONSTRAINT "uq_passes" UNIQUE("unique_identifier","career_id","university_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"university_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "tag_type" NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "universities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "apple_devices" ADD CONSTRAINT "apple_devices_unique_identifier_career_id_university_id_passes_unique_identifier_career_id_university_id_fk" FOREIGN KEY ("unique_identifier","career_id","university_id") REFERENCES "public"."passes"("unique_identifier","career_id","university_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boolean_tags" ADD CONSTRAINT "boolean_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boolean_tags" ADD CONSTRAINT "boolean_tags_unique_identifier_career_id_university_id_passes_unique_identifier_career_id_university_id_fk" FOREIGN KEY ("unique_identifier","career_id","university_id") REFERENCES "public"."passes"("unique_identifier","career_id","university_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "careers" ADD CONSTRAINT "careers_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_tags" ADD CONSTRAINT "date_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_tags" ADD CONSTRAINT "date_tags_unique_identifier_career_id_university_id_passes_unique_identifier_career_id_university_id_fk" FOREIGN KEY ("unique_identifier","career_id","university_id") REFERENCES "public"."passes"("unique_identifier","career_id","university_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_tags" ADD CONSTRAINT "list_tags_tag_option_id_list_tags_options_id_fk" FOREIGN KEY ("tag_option_id") REFERENCES "public"."list_tags_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_tags" ADD CONSTRAINT "list_tags_unique_identifier_career_id_university_id_passes_unique_identifier_career_id_university_id_fk" FOREIGN KEY ("unique_identifier","career_id","university_id") REFERENCES "public"."passes"("unique_identifier","career_id","university_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_tags_options" ADD CONSTRAINT "list_tags_options_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "numeric_tags" ADD CONSTRAINT "numeric_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "numeric_tags" ADD CONSTRAINT "numeric_tags_unique_identifier_career_id_university_id_passes_unique_identifier_career_id_university_id_fk" FOREIGN KEY ("unique_identifier","career_id","university_id") REFERENCES "public"."passes"("unique_identifier","career_id","university_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pass_updates" ADD CONSTRAINT "pass_updates_unique_identifier_career_id_university_id_passes_unique_identifier_career_id_university_id_fk" FOREIGN KEY ("unique_identifier","career_id","university_id") REFERENCES "public"."passes"("unique_identifier","career_id","university_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passes" ADD CONSTRAINT "passes_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passes" ADD CONSTRAINT "passes_career_id_university_id_careers_code_university_id_fk" FOREIGN KEY ("career_id","university_id") REFERENCES "public"."careers"("code","university_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_apple_devices_unique_identifier" ON "apple_devices" USING btree ("unique_identifier");--> statement-breakpoint
CREATE INDEX "idx_apple_devices_career_id" ON "apple_devices" USING btree ("career_id");--> statement-breakpoint
CREATE INDEX "idx_apple_devices_university_id" ON "apple_devices" USING btree ("university_id");--> statement-breakpoint
CREATE INDEX "idx_apple_devices_device_library_identifier" ON "apple_devices" USING btree ("device_library_identifier");--> statement-breakpoint
CREATE INDEX "idx_apple_devices_pass_type_identifier" ON "apple_devices" USING btree ("pass_type_identifier");--> statement-breakpoint
CREATE INDEX "idx_apple_devices_push_token" ON "apple_devices" USING btree ("push_token");--> statement-breakpoint
CREATE INDEX "idx_passes_unique_identifier" ON "passes" USING btree ("unique_identifier");--> statement-breakpoint
CREATE INDEX "idx_passes_payment_status" ON "passes" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_passes_pass_status" ON "passes" USING btree ("pass_status");--> statement-breakpoint
CREATE INDEX "idx_passes_career_id" ON "passes" USING btree ("career_id");--> statement-breakpoint
CREATE INDEX "idx_passes_career_payment" ON "passes" USING btree ("career_id","payment_status");--> statement-breakpoint
CREATE INDEX "idx_passes_status_dates" ON "passes" USING btree ("pass_status","start_due_date","end_due_date");--> statement-breakpoint
CREATE INDEX "idx_passes_career_year_semester" ON "passes" USING btree ("career_id","enrollment_year","semester");--> statement-breakpoint
CREATE INDEX "idx_passes_start_due_date" ON "passes" USING btree ("start_due_date");--> statement-breakpoint
CREATE INDEX "idx_passes_end_due_date" ON "passes" USING btree ("end_due_date");--> statement-breakpoint
CREATE INDEX "idx_passes_created_at" ON "passes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_passes_google_wallet_object_id" ON "passes" USING btree ("google_wallet_object_id");--> statement-breakpoint
CREATE INDEX "idx_passes_apple_wallet_serial_number" ON "passes" USING btree ("apple_wallet_serial_number");