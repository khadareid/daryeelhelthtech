import { Router } from "express";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import {
  getPublicDoctor,
  listPublicDoctors,
} from "../Controllers/UserController";
import {
  createAvailability,
  deleteAvailability,
  listMyAvailability,
  listPublicAvailability,
  updateAvailability,
} from "../Controllers/AvailabilityController";
import {
  getMyProfessionalProfile,
  updateMyProfessionalProfile,
} from "../Controllers/ProfessionalProfileController";

const router = Router();

/** Public directory — same data as GET /user/doctors (local DB) */
router.get("/", listPublicDoctors);
router.get("/:id/availability", listPublicAvailability);
router.get("/:idOrSlug", getPublicDoctor);

export default router;

export const professionalSelfRouter = Router();
professionalSelfRouter.use(decodeToken);
professionalSelfRouter.get("/profile", getMyProfessionalProfile);
professionalSelfRouter.patch("/profile", updateMyProfessionalProfile);
professionalSelfRouter.get("/availability", listMyAvailability);
professionalSelfRouter.post("/availability", createAvailability);
professionalSelfRouter.patch("/availability/:id", updateAvailability);
professionalSelfRouter.delete("/availability/:id", deleteAvailability);
