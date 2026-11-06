import { Router } from "express";
import { getMine, upsertMine } from "../Controllers/EmergencyCardController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", getMine);
router.put("/", upsertMine);
router.post("/", upsertMine);
export default router;
