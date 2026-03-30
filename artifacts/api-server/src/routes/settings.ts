import { Router, type IRouter } from "express";
import { NO_DB_MODE, db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/settings", async (req, res) => {
  if (NO_DB_MODE) {
    res.json({ eventKey: "local", eventName: "Local Dev (no DB)" });
    return;
  }
  try {
    const rows = await db.select().from(settingsTable);
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;
    res.json({
      eventKey: map["event_key"] ?? "",
      eventName: map["event_name"] ?? "",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/settings", async (req, res) => {
  if (NO_DB_MODE) {
    res.json({ eventKey: "local", eventName: "Local Dev (no DB)" });
    return;
  }
  try {
    const { eventKey, eventName } = req.body as { eventKey?: string; eventName?: string };
    if (eventKey !== undefined) {
      await db
        .update(settingsTable)
        .set({ value: eventKey, updatedAt: new Date() })
        .where(eq(settingsTable.key, "event_key"));
    }
    if (eventName !== undefined) {
      await db
        .update(settingsTable)
        .set({ value: eventName, updatedAt: new Date() })
        .where(eq(settingsTable.key, "event_name"));
    }
    const rows = await db.select().from(settingsTable);
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;
    res.json({
      eventKey: map["event_key"] ?? "",
      eventName: map["event_name"] ?? "",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
