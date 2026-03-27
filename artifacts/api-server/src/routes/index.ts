import { Router, type IRouter } from "express";
import healthRouter from "./health";
import matchEntriesRouter from "./matchEntries";
import hpEntriesRouter from "./hpEntries";
import pitEntriesRouter from "./pitEntries";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(matchEntriesRouter);
router.use(hpEntriesRouter);
router.use(pitEntriesRouter);
router.use(settingsRouter);

export default router;
