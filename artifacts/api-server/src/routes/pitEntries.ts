import { Router, type IRouter } from "express";
import { NO_DB_MODE, db, pitEntriesTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreatePitEntryBody, DeletePitEntryParams } from "@workspace/api-zod";
import { appendPitRow } from "../lib/googleSheets";
import { pitStore, insertPit, deletePit } from "../lib/memStore";

const router: IRouter = Router();

async function getEventKey(): Promise<string> {
  if (NO_DB_MODE) return "";
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map["event_key"] ?? "";
}

router.get("/pit-entries", async (req, res) => {
  if (NO_DB_MODE) { res.json(pitStore); return; }
  try {
    const entries = await db.select().from(pitEntriesTable).orderBy(pitEntriesTable.createdAt);
    res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch pit entries");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pit-entries", async (req, res) => {
  try {
    const body = CreatePitEntryBody.parse(req.body);
    if (NO_DB_MODE) {
      const entry = insertPit({
        scouter: body.scouter, teamNum: body.teamNum, teamName: body.teamName ?? "",
        drivetrain: body.drivetrain ?? "", avgCapacity: body.avgCapacity ?? "",
        autoPiecesScored: body.autoPiecesScored ?? "", canClimb: body.canClimb ?? "",
        climbLevels: body.climbLevels ?? "", comments: body.comments ?? "",
      });
      getEventKey().then((eventKey) => appendPitRow(eventKey, body)).catch(() => {});
      res.status(201).json(entry);
      return;
    }
    const [entry] = await db
      .insert(pitEntriesTable)
      .values({
        scouter: body.scouter, teamNum: body.teamNum, teamName: body.teamName ?? "",
        drivetrain: body.drivetrain ?? "", avgCapacity: body.avgCapacity ?? "",
        autoPiecesScored: body.autoPiecesScored ?? "", canClimb: body.canClimb ?? "",
        climbLevels: body.climbLevels ?? "", comments: body.comments ?? "",
      })
      .returning();
    getEventKey().then((eventKey) => appendPitRow(eventKey, body)).catch(() => {});
    res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to create pit entry");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/pit-entries/:id", async (req, res) => {
  try {
    const { id } = DeletePitEntryParams.parse({ id: Number(req.params.id) });
    if (NO_DB_MODE) { deletePit(id); res.status(204).send(); return; }
    await db.delete(pitEntriesTable).where(eq(pitEntriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete pit entry");
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
