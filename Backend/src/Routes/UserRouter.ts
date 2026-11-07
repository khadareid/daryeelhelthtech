import { Router } from "express";
import {
  adminCreate,
  adminDelete,
  adminGetUser,
  adminListUsers,
  adminUpdate,
  changeMyPassword,
  deleteMe,
  me,
  updateProfile,
} from "../Controllers/UserController";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import { adminOnly } from "../helpers/middleware/rbac";

const router = Router();

router.use(decodeToken);
router.get("/me", me);
router.put("/me", updateProfile);
router.patch("/me", updateProfile);
router.put("/me/password", changeMyPassword);
router.delete("/me", deleteMe);

router.get("/", adminOnly, adminListUsers);
router.post("/", adminOnly, adminCreate);
router.get("/:id", adminOnly, adminGetUser);
router.patch("/:id", adminOnly, adminUpdate);
router.put("/:id", adminOnly, adminUpdate);
router.delete("/:id", adminOnly, adminDelete);

export default router;
