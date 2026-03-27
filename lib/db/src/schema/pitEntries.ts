import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pitEntriesTable = pgTable("pit_entries", {
  id: serial("id").primaryKey(),
  scouter: text("scouter").notNull(),
  teamNum: text("team_num").notNull(),
  drivetrain: text("drivetrain").default(""),
  autoScore: text("auto_score").default(""),
  autoLocations: text("auto_locations").default(""),
  teleopScore: text("teleop_score").default(""),
  canClimb: text("can_climb").default(""),
  climbLevel: text("climb_level").default(""),
  climbLocation: text("climb_location").default(""),
  robotWeight: text("robot_weight").default(""),
  comments: text("comments").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPitEntrySchema = createInsertSchema(pitEntriesTable).omit({ id: true, createdAt: true });
export type InsertPitEntry = z.infer<typeof insertPitEntrySchema>;
export type PitEntry = typeof pitEntriesTable.$inferSelect;
