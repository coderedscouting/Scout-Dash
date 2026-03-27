import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// GET /settings — returns the active event key and name
router.get("/settings", async (req, res) => {
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
