import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pitEntriesTable = pgTable("pit_entries", {
  id: serial("id").primaryKey(),
  scouter: text("scouter").notNull(),
  teamNum: text("team_num").notNull(),
  teamName: text("team_name").default(""),
  drivetrain: text("drivetrain").default(""),
  avgCapacity: text("avg_capacity").default(""),
  autoFuelCount: text("auto_fuel_count").default(""),
  canClimb: text("can_climb").default(""),
  climbLocation: text("climb_location").default(""),
  comments: text("comments").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPitEntrySchema = createInsertSchema(pitEntriesTable).omit({ id: true, createdAt: true });
export type InsertPitEntry = z.infer<typeof insertPitEntrySchema>;
export type PitEntry = typeof pitEntriesTable.$inferSelect;
