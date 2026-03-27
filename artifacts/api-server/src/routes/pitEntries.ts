import { Router, type IRouter } from "express";
import { db, pitEntriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreatePitEntryBody, DeletePitEntryParams } from "@workspace/api-zod";

const router: IRouter = Router();

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
        drivetrain: body.drivetrain ?? "",
        autoScore: body.autoScore ?? "",
        autoLocations: body.autoLocations ?? "",
        teleopScore: body.teleopScore ?? "",
        canClimb: body.canClimb ?? "",
        climbLevel: body.climbLevel ?? "",
        climbLocation: body.climbLocation ?? "",
        robotWeight: body.robotWeight ?? "",
        comments: body.comments ?? "",
      })
      .returning();
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
