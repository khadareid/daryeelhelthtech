import { Router } from "express";
import { getMe, upsertMe } from "../Controllers/DoctorController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", getMe);
router.put("/", upsertMe);
router.patch("/", upsertMe);
router.post("/", upsertMe);

export default router;
