import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesDir = path.join(__dirname, "..", "src", "Routes");

const routers = {
  AuthRouter: `import { Router } from "express";
import { login, register } from "../Controllers/AuthController";

const router = Router();
router.post("/register", register);
router.post("/login", login);
export default router;
`,
  UserRouter: `import { Router } from "express";
import {
  adminUpdateUser,
  changePassword,
  getMe,
  getUserById,
  listUsers,
  softDeleteUser,
  updateMe,
} from "../Controllers/UserController";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import { adminOnly } from "../helpers/middleware/rbac";

const router = Router();
router.use(decodeToken);
router.get("/me", getMe);
router.put("/me", updateMe);
router.patch("/me", updateMe);
router.put("/me/password", changePassword);
router.get("/", adminOnly, listUsers);
router.get("/:id", getUserById);
router.patch("/:id", adminOnly, adminUpdateUser);
router.delete("/:id", adminOnly, softDeleteUser);
export default router;
`,
  MedicalProfileRouter: `import { Router } from "express";
import { getMedicalProfile, upsertMedicalProfile } from "../Controllers/MedicalProfileController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", getMedicalProfile);
router.put("/", upsertMedicalProfile);
router.post("/", upsertMedicalProfile);
export default router;
`,
  EmergencyCardRouter: `import { Router } from "express";
import { getEmergencyCard, upsertEmergencyCard } from "../Controllers/EmergencyCardController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", getEmergencyCard);
router.put("/", upsertEmergencyCard);
router.post("/", upsertEmergencyCard);
export default router;
`,
  DailyHealthLogRouter: `import { Router } from "express";
import {
  deleteDailyHealthLog,
  getDailyHealthLog,
  listDailyHealthLogs,
  updateDailyHealthLog,
  upsertDailyHealthLog,
} from "../Controllers/DailyHealthLogController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", listDailyHealthLogs);
router.get("/:id", getDailyHealthLog);
router.post("/", upsertDailyHealthLog);
router.put("/:id", updateDailyHealthLog);
router.patch("/:id", updateDailyHealthLog);
router.delete("/:id", deleteDailyHealthLog);
export default router;
`,
  DoctorRouter: `import { Router } from "express";
import {
  adminListDoctors,
  adminVerifyDoctor,
  getDoctor,
  getMyDoctorProfile,
  listDoctors,
  upsertMyDoctorProfile,
} from "../Controllers/DoctorController";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import { adminOnly } from "../helpers/middleware/rbac";

export const publicDoctorRouter = Router();
publicDoctorRouter.get("/", listDoctors);
publicDoctorRouter.get("/:id", getDoctor);

export const doctorSelfRouter = Router();
doctorSelfRouter.use(decodeToken);
doctorSelfRouter.get("/me", getMyDoctorProfile);
doctorSelfRouter.put("/me", upsertMyDoctorProfile);
doctorSelfRouter.post("/me", upsertMyDoctorProfile);

export const adminDoctorRouter = Router();
adminDoctorRouter.use(decodeToken, adminOnly);
adminDoctorRouter.get("/", adminListDoctors);
adminDoctorRouter.patch("/:id/verify", adminVerifyDoctor);
`,
  AppointmentRouter: `import { Router } from "express";
import {
  createAppointment,
  deleteAppointment,
  getAppointment,
  listAppointments,
  updateAppointmentStatus,
} from "../Controllers/AppointmentController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", listAppointments);
router.get("/:id", getAppointment);
router.post("/", createAppointment);
router.patch("/:id", updateAppointmentStatus);
router.put("/:id", updateAppointmentStatus);
router.delete("/:id", deleteAppointment);
export default router;
`,
  ConsultationRouter: `import { Router } from "express";
import {
  createConsultation,
  getConsultation,
  listConsultations,
  updateConsultation,
} from "../Controllers/ConsultationController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", listConsultations);
router.get("/:id", getConsultation);
router.post("/", createConsultation);
router.patch("/:id", updateConsultation);
router.put("/:id", updateConsultation);
export default router;
`,
  PrescriptionRouter: `import { Router } from "express";
import {
  createPrescription,
  getPrescription,
  listPrescriptions,
  updatePrescription,
} from "../Controllers/PrescriptionController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", listPrescriptions);
router.get("/:id", getPrescription);
router.post("/", createPrescription);
router.patch("/:id", updatePrescription);
router.put("/:id", updatePrescription);
export default router;
`,
  PaymentRouter: `import { Router } from "express";
import {
  createPayment,
  getPayment,
  listPayments,
  updatePayment,
} from "../Controllers/PaymentController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", listPayments);
router.get("/:id", getPayment);
router.post("/", createPayment);
router.patch("/:id", updatePayment);
router.put("/:id", updatePayment);
export default router;
`,
  ConsentRouter: `import { Router } from "express";
import { createConsent, listConsents, updateConsent } from "../Controllers/ConsentController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", listConsents);
router.post("/", createConsent);
router.patch("/:id", updateConsent);
router.put("/:id", updateConsent);
export default router;
`,
  AccessRequestRouter: `import { Router } from "express";
import {
  createAccessRequest,
  listAccessRequests,
  respondAccessRequest,
} from "../Controllers/AccessRequestController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", listAccessRequests);
router.post("/", createAccessRequest);
router.patch("/:id", respondAccessRequest);
export default router;
`,
  DiagnosisRouter: `import { Router } from "express";
import {
  createDiagnosis,
  deleteDiagnosis,
  listDiagnoses,
  updateDiagnosis,
} from "../Controllers/DiagnosisController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.use(decodeToken);
router.get("/", listDiagnoses);
router.post("/", createDiagnosis);
router.patch("/:id", updateDiagnosis);
router.put("/:id", updateDiagnosis);
router.delete("/:id", deleteDiagnosis);
export default router;
`,
  DoctorReviewRouter: `import { Router } from "express";
import {
  createDoctorReview,
  deleteDoctorReview,
  listDoctorReviews,
  updateDoctorReview,
} from "../Controllers/DoctorReviewController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();
router.get("/", listDoctorReviews);
router.post("/", decodeToken, createDoctorReview);
router.patch("/:id", decodeToken, updateDoctorReview);
router.put("/:id", decodeToken, updateDoctorReview);
router.delete("/:id", decodeToken, deleteDoctorReview);
export default router;
`,
  AdminRouter: `import { Router } from "express";
import { adminDashboard, listAuditLogs } from "../Controllers/AdminController";
import { adminDoctorRouter } from "./DoctorRouter";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import { adminOnly } from "../helpers/middleware/rbac";

const router = Router();
router.use(decodeToken, adminOnly);
router.get("/dashboard", adminDashboard);
router.get("/audit-logs", listAuditLogs);
router.use("/doctors", adminDoctorRouter);
export default router;
`,
};

for (const [name, content] of Object.entries(routers)) {
  fs.writeFileSync(path.join(routesDir, `${name}.ts`), content);
  console.log("Wrote", name);
}
