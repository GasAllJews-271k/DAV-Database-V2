import { Router, type IRouter } from "express";
import healthRouter from "./health";
import discordRouter from "./discord";
import robloxRouter from "./roblox";

const router: IRouter = Router();

router.use(healthRouter);
router.use(discordRouter);
router.use(robloxRouter);

export default router;
