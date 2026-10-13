import { NextFunction, Request, Response, Router } from "express";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import {
  addComment,
  addReaction,
  createNews,
  deleteComment,
  deleteNews,
  getNews,
  listNews,
  removeReaction,
  reportNews,
  updateComment,
  updateNews,
} from "../Controllers/NewsController";

const router = Router();

const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    next();
    return;
  }
  decodeToken(req, res, next);
};

router.get("/", optionalAuth, handle(listNews));
router.get("/:id", optionalAuth, handle(getNews));

router.post("/", decodeToken, handle(createNews));
router.patch("/:id", decodeToken, handle(updateNews));
router.delete("/:id", decodeToken, handle(deleteNews));

router.post("/:id/comments", decodeToken, handle(addComment));
router.patch("/comments/:commentId", decodeToken, handle(updateComment));
router.delete("/comments/:commentId", decodeToken, handle(deleteComment));

router.post("/:id/reactions", decodeToken, handle(addReaction));
router.delete("/:id/reactions", decodeToken, handle(removeReaction));

router.post("/reports", decodeToken, handle(reportNews));

export default router;
