import { Router } from "express";
import {
  publicBundle,
  publicPage,
  publicPages,
  publicSettings,
  publicTeam,
} from "../Controllers/CmsController";

const router = Router();

router.get("/bundle", publicBundle);
router.get("/settings", publicSettings);
router.get("/pages", publicPages);
router.get("/pages/:slug", publicPage);
router.get("/team", publicTeam);

export default router;
