// routes/user.routes.ts
import { Router } from "express";
import {
  register,
  login,
  getUserProfile,
  updateUserProfile,
  changePassword,
  changeRole,
  listPublicDoctors,
} from "../Controllers/UserController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/doctors", listPublicDoctors);
router.get("/profile/:userid", decodeToken, getUserProfile);
router.put("/profile/:userid", decodeToken, updateUserProfile);
router.put("/profile/:userid/password", decodeToken, changePassword);
router.patch("/profile/:userid/role", decodeToken, changeRole);

export default router;