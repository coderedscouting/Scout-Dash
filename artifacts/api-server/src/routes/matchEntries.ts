import { Router, type IRouter } from "express";
import { NO_DB_MODE, db, matchEntriesTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateMatchEntryBody, DeleteMatchEntryParams } from "@workspace/api-zod";
import { appendMatchRow } from "../lib/googleSheets";
import { matchStore, insertMatch, deleteMatch } from "../lib/memStore";

const router: IRouter = Router();

async function getEventKey(): Promise<string> {
  if (NO_DB_MODE) return "";
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map["event_key"] ?? "";
}

router.get("/match-entries", async (req, res) => {
  if (NO_DB_MODE) { res.json(matchStore); return; }
  try {
    const entries = await db.select().from(matchEntriesTable).orderBy(matchEntriesTable.createdAt);
    res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch match entries");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/match-entries", async (req, res) => {
  try {
    const body = CreateMatchEntryBody.parse(req.body);
    if (NO_DB_MODE) {
      const entry = insertMatch({
        scouter: body.scouter, teamNum: body.teamNum, matchNum: body.matchNum,
        startPos: body.startPos, autoCycles: body.autoCycles ?? null,
        autoClimb: body.autoClimb ?? null, teleCycles: body.teleCycles ?? null,
        teleClimb: body.teleClimb ?? null, comments: body.comments ?? "",
        defensePlayed: body.defensePlayed ?? "No", defenseRating: body.defenseRating ?? "",
      });
      getEventKey().then((eventKey) => appendMatchRow(eventKey, body)).catch(() => {});
      res.status(201).json(entry);
      return;
    }
    const [entry] = await db
      .insert(matchEntriesTable)
      .values({
        scouter: body.scouter, teamNum: body.teamNum, matchNum: body.matchNum,
        startPos: body.startPos, autoCycles: body.autoCycles ?? null,
        autoClimb: body.autoClimb ?? null, teleCycles: body.teleCycles ?? null,
        teleClimb: body.teleClimb ?? null, comments: body.comments ?? "",
        defensePlayed: body.defensePlayed ?? "No", defenseRating: body.defenseRating ?? "",
      })
      .returning();
    getEventKey().then((eventKey) => appendMatchRow(eventKey, body)).catch(() => {});
    res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to create match entry");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/match-entries/:id", async (req, res) => {
  try {
    const { id } = DeleteMatchEntryParams.parse({ id: Number(req.params.id) });
    if (NO_DB_MODE) { deleteMatch(id); res.status(204).send(); return; }
    await db.delete(matchEntriesTable).where(eq(matchEntriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete match entry");
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
