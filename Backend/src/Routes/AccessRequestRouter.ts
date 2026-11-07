import { Router } from "express";
import { create, list, respond } from "../Controllers/AccessRequestController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", list);
router.post("/", create);
router.patch("/:id", respond);
router.put("/:id", respond);
export default router;
