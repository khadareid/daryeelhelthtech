import { Router } from "express"; 
import { sendCode } from "./google/Send-code";
import { verifyCode } from "./google/Verify-code";
const router = Router();

router.post("/sendcode", sendCode);
router.post("/verify-code", verifyCode);

export default router;
