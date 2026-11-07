import { Router } from "express";
import { create, list, remove, update } from "../Controllers/DoctorReviewController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.get("/", list);
router.post("/", decodeToken, create);
router.patch("/:id", decodeToken, update);
router.put("/:id", decodeToken, update);
router.delete("/:id", decodeToken, remove);
export default router;
