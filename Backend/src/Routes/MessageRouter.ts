import { NextFunction, Request, Response, Router } from "express";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import {
  createMessage,
  deleteMessage,
  getOneMessage,
  getThread,
  listConversations,
  listInbox,
  listMessages,
  listSent,
  markRead,
  unreadCount,
} from "../Controllers/MessageController";

const router = Router();

const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

router.use(decodeToken);

router.post("/", handle(createMessage));
router.get("/", handle(listMessages));
router.get("/inbox", handle(listInbox));
router.get("/sent", handle(listSent));
router.get("/conversations", handle(listConversations));
router.get("/unread-count", handle(unreadCount));
router.get("/thread/:peerId", handle(getThread));
router.get("/:id", handle(getOneMessage));
router.patch("/:id/read", handle(markRead));
router.delete("/:id", handle(deleteMessage));

export default router;
