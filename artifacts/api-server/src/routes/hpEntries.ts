import { Router, type IRouter } from "express";
import { db, hpEntriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateHpEntryBody, DeleteHpEntryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/hp-entries", async (req, res) => {
  try {
    const entries = await db.select().from(hpEntriesTable).orderBy(hpEntriesTable.createdAt);
    res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch hp entries");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/hp-entries", async (req, res) => {
  try {
    const body = CreateHpEntryBody.parse(req.body);
    const [entry] = await db
      .insert(hpEntriesTable)
      .values({
        scouter: body.scouter,
        matchNum: body.matchNum,
        alliance: body.alliance,
        scores: body.scores,
      })
      .returning();
    res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to create hp entry");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/hp-entries/:id", async (req, res) => {
  try {
    const { id } = DeleteHpEntryParams.parse({ id: Number(req.params.id) });
    await db.delete(hpEntriesTable).where(eq(hpEntriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete hp entry");
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
