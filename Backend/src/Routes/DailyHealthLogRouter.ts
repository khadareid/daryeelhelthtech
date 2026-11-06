import { Router } from "express";
import { getOne, list, remove, upsert } from "../Controllers/DailyHealthLogController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", list);
router.get("/:id", getOne);
router.post("/", upsert);
router.put("/", upsert);
router.delete("/:id", remove);
export default router;
