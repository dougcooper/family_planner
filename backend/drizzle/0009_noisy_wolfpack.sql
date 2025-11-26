CREATE TABLE IF NOT EXISTS "meal_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meal_plans" DROP CONSTRAINT "meal_plans_family_id_date_meal_type_unique";--> statement-breakpoint
ALTER TABLE "meal_plans" ALTER COLUMN "meal_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meal_plans" ADD COLUMN "meal_label_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_meal_label_id_meal_labels_id_fk" FOREIGN KEY ("meal_label_id") REFERENCES "meal_labels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_labels" ADD CONSTRAINT "meal_labels_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Data Migration: Create default labels for existing families
INSERT INTO "meal_labels" ("family_id", "name", "sort_order")
SELECT "id", 'Breakfast', 0 FROM "families";
--> statement-breakpoint
INSERT INTO "meal_labels" ("family_id", "name", "sort_order")
SELECT "id", 'Lunch', 1 FROM "families";
--> statement-breakpoint
INSERT INTO "meal_labels" ("family_id", "name", "sort_order")
SELECT "id", 'Dinner', 2 FROM "families";
--> statement-breakpoint
-- Data Migration: Update existing meal plans to point to new labels
UPDATE "meal_plans" mp
SET "meal_label_id" = ml.id
FROM "meal_labels" ml
WHERE mp."family_id" = ml."family_id"
  AND (
    (mp."meal_type" = 'BREAKFAST' AND ml."name" = 'Breakfast') OR
    (mp."meal_type" = 'LUNCH' AND ml."name" = 'Lunch') OR
    (mp."meal_type" = 'DINNER' AND ml."name" = 'Dinner')
  );
--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_family_id_date_meal_label_id_unique" UNIQUE("family_id","date","meal_label_id");