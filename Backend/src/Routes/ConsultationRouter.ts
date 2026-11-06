import { Router } from "express";
import { create, getOne, list, update } from "../Controllers/ConsultationController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", list);
router.get("/:id", getOne);
router.post("/", create);
router.patch("/:id", update);
router.put("/:id", update);
export default router;
