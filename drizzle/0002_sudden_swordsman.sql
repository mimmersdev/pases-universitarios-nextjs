CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_name" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "uq_user_name" UNIQUE("user_name")
);
