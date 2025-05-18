CREATE TABLE "csv_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"upload_id" integer NOT NULL,
	"row_index" integer NOT NULL,
	"row_type" text NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"line_item" text NOT NULL,
	"values" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "csv_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"filename" text NOT NULL,
	"content" text NOT NULL,
	"month" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"processed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"month" text NOT NULL,
	"year" integer NOT NULL,
	"revenue" numeric NOT NULL,
	"expenses" numeric NOT NULL,
	"net_income" numeric NOT NULL,
	"profit_margin" numeric,
	"upload_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"month" text NOT NULL,
	"year" integer NOT NULL,
	"revenue" numeric NOT NULL,
	"expenses" numeric NOT NULL,
	"net_income" numeric NOT NULL,
	"percentage_of_total" numeric,
	"upload_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "financial_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "financial_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"parent_id" integer,
	"category_id" integer,
	"row_type" text NOT NULL,
	"upload_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"line_item_id" integer NOT NULL,
	"entity_name" text NOT NULL,
	"original_value" text NOT NULL,
	"numeric_value" numeric NOT NULL,
	"month" text,
	"year" integer DEFAULT 2024 NOT NULL,
	"file_type" text NOT NULL,
	"upload_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "financial_values_line_item_id_entity_name_month_year_file_type_pk" PRIMARY KEY("line_item_id","entity_name","month","year","file_type")
);
--> statement-breakpoint
CREATE TABLE "monthly_financial_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" text NOT NULL,
	"year" integer NOT NULL,
	"total_revenue" numeric NOT NULL,
	"total_expenses" numeric NOT NULL,
	"net_income" numeric NOT NULL,
	"revenue_mix" jsonb,
	"margin_trend" jsonb,
	"upload_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upload_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" text NOT NULL,
	"year" integer NOT NULL,
	"annual_uploaded" boolean DEFAULT false NOT NULL,
	"monthly_e_uploaded" boolean DEFAULT false NOT NULL,
	"monthly_o_uploaded" boolean DEFAULT false NOT NULL,
	"e_file_upload_id" integer,
	"o_file_upload_id" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "upload_status_month_year_pk" PRIMARY KEY("month","year")
);
--> statement-breakpoint
ALTER TABLE "csv_data" ADD CONSTRAINT "csv_data_upload_id_csv_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."csv_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_performance" ADD CONSTRAINT "department_performance_upload_id_csv_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."csv_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_performance" ADD CONSTRAINT "doctor_performance_upload_id_csv_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."csv_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_parent_id_financial_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."financial_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_line_items" ADD CONSTRAINT "financial_line_items_parent_id_financial_line_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."financial_line_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_line_items" ADD CONSTRAINT "financial_line_items_category_id_financial_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."financial_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_line_items" ADD CONSTRAINT "financial_line_items_upload_id_csv_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."csv_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_values" ADD CONSTRAINT "financial_values_line_item_id_financial_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."financial_line_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_values" ADD CONSTRAINT "financial_values_upload_id_csv_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."csv_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_financial_data" ADD CONSTRAINT "monthly_financial_data_upload_id_csv_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."csv_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_status" ADD CONSTRAINT "upload_status_e_file_upload_id_csv_uploads_id_fk" FOREIGN KEY ("e_file_upload_id") REFERENCES "public"."csv_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_status" ADD CONSTRAINT "upload_status_o_file_upload_id_csv_uploads_id_fk" FOREIGN KEY ("o_file_upload_id") REFERENCES "public"."csv_uploads"("id") ON DELETE no action ON UPDATE no action;