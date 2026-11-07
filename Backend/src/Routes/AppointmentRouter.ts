import { Router } from "express";
import {
  create,
  getOne,
  list,
  remove,
  update,
} from "../Controllers/AppointmentController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", list);
router.get("/:id", getOne);
router.post("/", create);
router.patch("/:id", update);
router.put("/:id", update);
router.delete("/:id", remove);
export default router;
