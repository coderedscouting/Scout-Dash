import { Router, type IRouter } from "express";
import { NO_DB_MODE, db, settingsTable } from "@workspace/db";

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

export default router;
