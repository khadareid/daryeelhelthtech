import { Router } from "express";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import {
  acceptConnection,
  endConnection,
  listConnectionRequests,
  listConnections,
  rejectConnection,
  requestConnection,
} from "../Controllers/ConnectionController";

const router = Router();

router.use(decodeToken);
router.post("/", requestConnection);
router.get("/", listConnections);
router.get("/requests", listConnectionRequests);
router.patch("/:id/accept", acceptConnection);
router.patch("/:id/reject", rejectConnection);
router.patch("/:id/end", endConnection);

export default router;
