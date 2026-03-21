import { Router, type IRouter } from "express";
import { db, matchEntriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateMatchEntryBody, DeleteMatchEntryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/match-entries", async (req, res) => {
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
    const [entry] = await db
      .insert(matchEntriesTable)
      .values({
        scouter: body.scouter,
        teamNum: body.teamNum,
        matchNum: body.matchNum,
        startPos: body.startPos,
        autoCycles: body.autoCycles ?? null,
        autoClimb: body.autoClimb ?? null,
        teleCycles: body.teleCycles ?? null,
        teleClimb: body.teleClimb ?? null,
        comments: body.comments ?? "",
        defensePlayed: body.defensePlayed ?? "No",
        defenseRating: body.defenseRating ?? "",
      })
      .returning();
    res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to create match entry");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/match-entries/:id", async (req, res) => {
  try {
    const { id } = DeleteMatchEntryParams.parse({ id: Number(req.params.id) });
    await db.delete(matchEntriesTable).where(eq(matchEntriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete match entry");
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
