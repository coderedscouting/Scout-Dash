import { Router, type IRouter } from "express";
import { db, pitEntriesTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreatePitEntryBody, DeletePitEntryParams } from "@workspace/api-zod";
import { appendPitRow } from "../lib/googleSheets";

const router: IRouter = Router();

async function getEventKey(): Promise<string> {
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map["event_key"] ?? "";
}

router.get("/pit-entries", async (req, res) => {
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
    const [entry] = await db
      .insert(pitEntriesTable)
      .values({
        scouter: body.scouter,
        teamNum: body.teamNum,
        teamName: body.teamName ?? "",
        drivetrain: body.drivetrain ?? "",
        avgCapacity: body.avgCapacity ?? "",
        autoFuelCount: body.autoFuelCount ?? "",
        canClimb: body.canClimb ?? "",
        climbLocation: body.climbLocation ?? "",
        comments: body.comments ?? "",
      })
      .returning();

    getEventKey()
      .then((eventKey) => appendPitRow(eventKey, body))
      .catch(() => {});

    res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to create pit entry");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/pit-entries/:id", async (req, res) => {
  try {
    const { id } = DeletePitEntryParams.parse({ id: Number(req.params.id) });
    await db.delete(pitEntriesTable).where(eq(pitEntriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete pit entry");
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
