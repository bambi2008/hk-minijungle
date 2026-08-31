import { pgTable, bigserial, uuid, varchar, text, jsonb, boolean, timestamp, index, integer } from "drizzle-orm/pg-core";

export const learningCases = pgTable("fivecrop_learning_cases", {
  sequence: bigserial("sequence", { mode: "number" }).primaryKey(),
  id: uuid("id").notNull().unique(),
  ownerHash: varchar("owner_hash", { length: 64 }).notNull(),
  digest: varchar("digest", { length: 64 }).notNull(),
  cropKey: varchar("crop_key", { length: 20 }).notNull(),
  snapshot: jsonb("snapshot").notNull(),
  photo: jsonb("photo").notNull(),
  photoReady: boolean("photo_ready").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" })
}, (table) => [index("fivecrop_learning_owner_sequence").on(table.ownerHash, table.sequence)]);

export const learningEvents = pgTable("fivecrop_learning_events", {
  sequence: bigserial("sequence", { mode: "number" }).primaryKey(),
  id: uuid("id").notNull().unique(),
  caseId: uuid("case_id").notNull().references(() => learningCases.id, { onDelete: "cascade" }),
  digest: varchar("digest", { length: 64 }).notNull(),
  kind: varchar("kind", { length: 20 }).notNull(),
  payload: jsonb("payload").notNull(),
  photoReady: boolean("photo_ready").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow()
}, (table) => [index("fivecrop_learning_case_events").on(table.caseId, table.sequence)]);

export const learningLimits = pgTable("fivecrop_learning_limits", {
  bucket: text("bucket").primaryKey(),
  count: integer("count").notNull()
});
