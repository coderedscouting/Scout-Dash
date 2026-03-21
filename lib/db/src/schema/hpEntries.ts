import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hpEntriesTable = pgTable("hp_entries", {
  id: serial("id").primaryKey(),
  scouter: text("scouter").notNull(),
  matchNum: integer("match_num").notNull(),
  alliance: text("alliance").notNull(),
  scores: integer("scores").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHpEntrySchema = createInsertSchema(hpEntriesTable).omit({ id: true, createdAt: true });
export type InsertHpEntry = z.infer<typeof insertHpEntrySchema>;
export type HpEntry = typeof hpEntriesTable.$inferSelect;
