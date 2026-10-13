import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

function getUserId(req: Request): string | null {
  const user = (req as any).user;
  return user?.userId || user?.userid || user?.id || null;
}

function paginate(query: Request["query"]) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 30));
  return { page, limit, skip: (page - 1) * limit };
}

/** POST /messages — patient ↔ clinician chat */
export const createMessage = async (req: Request, res: Response) => {
  try {
    const senderId = getUserId(req);
    if (!senderId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const { recipientId, recipientType, subject, body, attachmentUrl } =
      req.body ?? {};

    if (!body || typeof body !== "string" || !body.trim()) {
      res.status(400).json({ isSuccess: false, message: "Message body is required" });
      return;
    }

    if (!recipientId || typeof recipientId !== "string") {
      res.status(400).json({
        isSuccess: false,
        message: "recipientId is required (doctor user or clinician id)",
      });
      return;
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        recipientId: String(recipientId),
        recipientType: recipientType ? String(recipientType) : "CLINICIAN",
        subject: subject ? String(subject) : null,
        body: body.trim(),
        attachmentUrl: attachmentUrl ? String(attachmentUrl) : null,
      },
      include: {
        sender: {
          select: {
            userid: true,
            fullName: true,
            avatarUrl: true,
            picture: true,
          },
        },
      },
    });

    res.status(201).json({
      isSuccess: true,
      message: "Message sent",
      result: message,
    });
  } catch (error) {
    console.error("createMessage error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to send message" });
  }
};

/** GET /messages — all threads involving me */
export const listMessages = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const { page, limit, skip } = paginate(req.query);
    const peerId =
      typeof req.query.peerId === "string" ? req.query.peerId : undefined;

    const where = peerId
      ? {
          OR: [
            { senderId: userId, recipientId: peerId },
            { senderId: peerId, recipientId: userId },
            { senderId: userId, recipientId: peerId },
          ],
        }
      : {
          OR: [{ senderId: userId }, { recipientId: userId }],
        };

    const [total, data] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              userid: true,
              fullName: true,
              avatarUrl: true,
              picture: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      isSuccess: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("listMessages error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load messages" });
  }
};

/** GET /messages/inbox */
export const listInbox = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const { page, limit, skip } = paginate(req.query);
    const where = { recipientId: userId };

    const [total, data] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              userid: true,
              fullName: true,
              avatarUrl: true,
              picture: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      isSuccess: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("listInbox error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load inbox" });
  }
};

/** GET /messages/sent */
export const listSent = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const { page, limit, skip } = paginate(req.query);
    const where = { senderId: userId };

    const [total, data] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    res.status(200).json({
      isSuccess: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("listSent error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load sent messages" });
  }
};

/** GET /messages/unread-count */
export const unreadCount = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const count = await prisma.message.count({
      where: { recipientId: userId, isRead: false },
    });

    res.status(200).json({ isSuccess: true, unreadCount: count });
  } catch (error) {
    console.error("unreadCount error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to count unread" });
  }
};

/** GET /messages/thread/:peerId — conversation with a clinician */
export const getThread = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const peerId = String(req.params.peerId || "");
    if (!peerId) {
      res.status(400).json({ isSuccess: false, message: "peerId required" });
      return;
    }

    const data = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: peerId },
          { senderId: peerId, recipientId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: {
        sender: {
          select: {
            userid: true,
            fullName: true,
            avatarUrl: true,
            picture: true,
          },
        },
      },
    });

    res.status(200).json({ isSuccess: true, result: data });
  } catch (error) {
    console.error("getThread error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load thread" });
  }
};

/** GET /messages/:id */
export const getOneMessage = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const id = String(req.params.id || "");
    const message = await prisma.message.findFirst({
      where: {
        messageid: id,
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      include: {
        sender: {
          select: {
            userid: true,
            fullName: true,
            avatarUrl: true,
            picture: true,
          },
        },
      },
    });

    if (!message) {
      res.status(404).json({ isSuccess: false, message: "Message not found" });
      return;
    }

    res.status(200).json({ isSuccess: true, result: message });
  } catch (error) {
    console.error("getOneMessage error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load message" });
  }
};

/** PATCH /messages/:id/read */
export const markRead = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const id = String(req.params.id || "");
    const existing = await prisma.message.findFirst({
      where: { messageid: id, recipientId: userId },
    });

    if (!existing) {
      res.status(404).json({ isSuccess: false, message: "Message not found" });
      return;
    }

    await prisma.message.update({
      where: { messageid: id },
      data: { isRead: true, readAt: new Date() },
    });

    res.status(200).json({ isSuccess: true, message: "Marked as read" });
  } catch (error) {
    console.error("markRead error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to mark read" });
  }
};

/** DELETE /messages/:id */
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const id = String(req.params.id || "");
    const existing = await prisma.message.findFirst({
      where: {
        messageid: id,
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
    });

    if (!existing) {
      res.status(404).json({ isSuccess: false, message: "Message not found" });
      return;
    }

    await prisma.message.delete({ where: { messageid: id } });
    res.status(200).json({ isSuccess: true, message: "Message deleted" });
  } catch (error) {
    console.error("deleteMessage error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to delete message" });
  }
};
