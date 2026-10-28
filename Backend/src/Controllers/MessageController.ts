import { Request, Response } from "express";
import { NotificationChannel, NotificationType } from "@prisma/client";
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

const PERSON_SELECT = {
  userid: true,
  fullName: true,
  avatarUrl: true,
  picture: true,
} as const;

const MESSAGE_INCLUDE = {
  sender: { select: PERSON_SELECT },
  recipient: { select: PERSON_SELECT },
} as const;

async function resolveRecipientUserId(rawId: string): Promise<string | null> {
  const id = String(rawId || "").trim();
  if (!id) return null;

  const user = await prisma.user.findFirst({
    where: { userid: id, isDeleted: false },
    select: { userid: true },
  });
  if (user) return user.userid;

  const pro = await prisma.professionalProfile.findFirst({
    where: {
      deletedAt: null,
      OR: [{ professionalprofileid: id }, { slug: id }, { userId: id }],
    },
    select: { userId: true },
  });
  return pro?.userId ?? null;
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

    const resolvedRecipient = await resolveRecipientUserId(recipientId);
    if (!resolvedRecipient) {
      res.status(404).json({
        isSuccess: false,
        message: "Recipient not found",
      });
      return;
    }

    if (resolvedRecipient === senderId) {
      res.status(400).json({
        isSuccess: false,
        message: "You cannot message yourself",
      });
      return;
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        recipientId: resolvedRecipient,
        recipientType: recipientType ? String(recipientType) : "USER",
        subject: subject ? String(subject) : null,
        body: body.trim(),
        attachmentUrl: attachmentUrl ? String(attachmentUrl) : null,
      },
      include: MESSAGE_INCLUDE,
    });

    await prisma.notification
      .create({
        data: {
          userId: resolvedRecipient,
          title: "New message",
          body: `${message.sender.fullName}: ${body.trim().slice(0, 120)}`,
          type: NotificationType.MESSAGE,
          channel: NotificationChannel.IN_APP,
          metadata: {
            messageId: message.messageid,
            fromUserId: senderId,
          },
        },
      })
      .catch(() => undefined);

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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: MESSAGE_INCLUDE,
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
        include: MESSAGE_INCLUDE,
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
        include: MESSAGE_INCLUDE,
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

/** GET /messages/conversations — peers with real names for the inbox list */
export const listConversations = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: MESSAGE_INCLUDE,
    });

    const map = new Map<
      string,
      {
        peerId: string;
        name: string;
        image: string | null;
        preview: string;
        at: string;
      }
    >();

    for (const msg of messages) {
      const otherId: string =
        msg.senderId === userId ? msg.recipientId || "" : msg.senderId;
      if (!otherId || otherId === userId) continue;
      if (map.has(otherId)) continue;

      const person =
        msg.senderId === userId ? msg.recipient : msg.sender;
      map.set(otherId, {
        peerId: otherId,
        name: person?.fullName?.trim() || "Unknown",
        image: person?.avatarUrl || person?.picture || null,
        preview: msg.body,
        at: msg.createdAt.toISOString(),
      });
    }

    // Fill any missing names from User table
    const missing = [...map.values()].filter(
      (c) => !c.name || c.name === "Unknown",
    );
    if (missing.length) {
      const users = await prisma.user.findMany({
        where: {
          userid: { in: missing.map((m) => m.peerId) },
          isDeleted: false,
        },
        select: PERSON_SELECT,
      });
      for (const u of users) {
        const row = map.get(u.userid);
        if (row) {
          row.name = u.fullName;
          row.image = u.avatarUrl || u.picture || row.image;
        }
      }
    }

    res.status(200).json({
      isSuccess: true,
      result: Array.from(map.values()),
    });
  } catch (error) {
    console.error("listConversations error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to load conversations",
    });
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

    const rawPeerId = String(req.params.peerId || "");
    if (!rawPeerId) {
      res.status(400).json({ isSuccess: false, message: "peerId required" });
      return;
    }

    const resolvedPeerId =
      (await resolveRecipientUserId(rawPeerId)) || rawPeerId;
    const peerIds = Array.from(new Set([rawPeerId, resolvedPeerId]));

    const [data, peer] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: peerIds.flatMap((pid) => [
            { senderId: userId, recipientId: pid },
            { senderId: pid, recipientId: userId },
          ]),
        },
        orderBy: { createdAt: "asc" },
        take: 200,
        include: MESSAGE_INCLUDE,
      }),
      prisma.user.findFirst({
        where: { userid: resolvedPeerId, isDeleted: false },
        select: PERSON_SELECT,
      }),
    ]);

    // Fallback: infer peer name from message participants
    let peerPayload = peer
      ? {
          userId: peer.userid,
          name: peer.fullName,
          image: peer.avatarUrl || peer.picture,
        }
      : null;

    if (!peerPayload && data.length > 0) {
      const sample = data[0];
      const other =
        sample.senderId === userId ? sample.recipient : sample.sender;
      if (other) {
        peerPayload = {
          userId: other.userid,
          name: other.fullName,
          image: other.avatarUrl || other.picture,
        };
      }
    }

    res.status(200).json({
      isSuccess: true,
      result: data,
      peer: peerPayload,
    });
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
