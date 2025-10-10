CREATE TYPE "public"."roles" AS ENUM('admin', 'shiftLead');--> statement-breakpoint
CREATE TABLE "images" (
	"id" serial PRIMARY KEY NOT NULL,
	"base64_image" text NOT NULL,
	"filename" varchar(256) NOT NULL,
	"author_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"login" varchar(256) NOT NULL,
	"hashed_password" varchar(256) NOT NULL,
	"role" "roles" DEFAULT 'shiftLead' NOT NULL,
	CONSTRAINT "users_login_unique" UNIQUE("login")
);
