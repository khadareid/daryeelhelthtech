import { Router } from "express";
import {
  adminAppointments,
  auditLogs,
  createDoctor,
  createUser,
  dashboard,
  deleteDoctor,
  deleteUser,
  getDoctor,
  getUser,
  listDoctors,
  listUsers,
  pendingDoctors,
  resetUserPassword,
  updateDoctor,
  updateUser,
  verifyDoctor,
} from "../Controllers/AdminController";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import { adminOnly } from "../helpers/middleware/rbac";

const router = Router();
router.use(decodeToken, adminOnly);

router.get("/dashboard", dashboard);
router.get("/audit-logs", auditLogs);

router.get("/users", listUsers);
router.post("/users", createUser);
router.get("/users/:id", getUser);
router.patch("/users/:id", updateUser);
router.put("/users/:id", updateUser);
router.post("/users/:id/reset-password", resetUserPassword);
router.patch("/users/:id/reset-password", resetUserPassword);
router.delete("/users/:id", deleteUser);

router.get("/doctors", listDoctors);
router.post("/doctors", createDoctor);
router.get("/doctors/pending", pendingDoctors);
router.get("/doctors/:id", getDoctor);
router.patch("/doctors/:id", updateDoctor);
router.put("/doctors/:id", updateDoctor);
router.delete("/doctors/:id", deleteDoctor);
router.patch("/doctors/:id/verify", verifyDoctor);
router.put("/doctors/:id/verify", verifyDoctor);

router.get("/appointments", adminAppointments);

export default router;
