import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const matchEntriesTable = pgTable("match_entries", {
  id: serial("id").primaryKey(),
  scouter: text("scouter").notNull(),
  teamNum: text("team_num").notNull(),
  matchNum: integer("match_num").notNull(),
  startPos: text("start_pos").notNull().default(""),
  autoCycles: jsonb("auto_cycles"),
  autoClimb: jsonb("auto_climb"),
  teleCycles: jsonb("tele_cycles"),
  teleClimb: jsonb("tele_climb"),
  comments: text("comments").default(""),
  defensePlayed: text("defense_played").default("No"),
  defenseRating: text("defense_rating").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMatchEntrySchema = createInsertSchema(matchEntriesTable).omit({ id: true, createdAt: true });
export type InsertMatchEntry = z.infer<typeof insertMatchEntrySchema>;
export type MatchEntry = typeof matchEntriesTable.$inferSelect;
