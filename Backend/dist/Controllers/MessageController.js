"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.markRead = exports.getOneMessage = exports.getThread = exports.unreadCount = exports.listSent = exports.listInbox = exports.listMessages = exports.createMessage = void 0;
const prisma_1 = require("../lib/prisma");
function getUserId(req) {
    const user = req.user;
    return (user === null || user === void 0 ? void 0 : user.userId) || (user === null || user === void 0 ? void 0 : user.userid) || (user === null || user === void 0 ? void 0 : user.id) || null;
}
function paginate(query) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 30));
    return { page, limit, skip: (page - 1) * limit };
}
/** POST /messages — patient ↔ clinician chat */
const createMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const senderId = getUserId(req);
        if (!senderId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const { recipientId, recipientType, subject, body, attachmentUrl } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
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
        const message = yield prisma_1.prisma.message.create({
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
    }
    catch (error) {
        console.error("createMessage error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to send message" });
    }
});
exports.createMessage = createMessage;
/** GET /messages — all threads involving me */
const listMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const { page, limit, skip } = paginate(req.query);
        const peerId = typeof req.query.peerId === "string" ? req.query.peerId : undefined;
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
        const [total, data] = yield Promise.all([
            prisma_1.prisma.message.count({ where }),
            prisma_1.prisma.message.findMany({
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
    }
    catch (error) {
        console.error("listMessages error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load messages" });
    }
});
exports.listMessages = listMessages;
/** GET /messages/inbox */
const listInbox = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const { page, limit, skip } = paginate(req.query);
        const where = { recipientId: userId };
        const [total, data] = yield Promise.all([
            prisma_1.prisma.message.count({ where }),
            prisma_1.prisma.message.findMany({
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
    }
    catch (error) {
        console.error("listInbox error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load inbox" });
    }
});
exports.listInbox = listInbox;
/** GET /messages/sent */
const listSent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const { page, limit, skip } = paginate(req.query);
        const where = { senderId: userId };
        const [total, data] = yield Promise.all([
            prisma_1.prisma.message.count({ where }),
            prisma_1.prisma.message.findMany({
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
    }
    catch (error) {
        console.error("listSent error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load sent messages" });
    }
});
exports.listSent = listSent;
/** GET /messages/unread-count */
const unreadCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const count = yield prisma_1.prisma.message.count({
            where: { recipientId: userId, isRead: false },
        });
        res.status(200).json({ isSuccess: true, unreadCount: count });
    }
    catch (error) {
        console.error("unreadCount error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to count unread" });
    }
});
exports.unreadCount = unreadCount;
/** GET /messages/thread/:peerId — conversation with a clinician */
const getThread = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const data = yield prisma_1.prisma.message.findMany({
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
    }
    catch (error) {
        console.error("getThread error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load thread" });
    }
});
exports.getThread = getThread;
/** GET /messages/:id */
const getOneMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const id = String(req.params.id || "");
        const message = yield prisma_1.prisma.message.findFirst({
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
    }
    catch (error) {
        console.error("getOneMessage error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load message" });
    }
});
exports.getOneMessage = getOneMessage;
/** PATCH /messages/:id/read */
const markRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const id = String(req.params.id || "");
        const existing = yield prisma_1.prisma.message.findFirst({
            where: { messageid: id, recipientId: userId },
        });
        if (!existing) {
            res.status(404).json({ isSuccess: false, message: "Message not found" });
            return;
        }
        yield prisma_1.prisma.message.update({
            where: { messageid: id },
            data: { isRead: true, readAt: new Date() },
        });
        res.status(200).json({ isSuccess: true, message: "Marked as read" });
    }
    catch (error) {
        console.error("markRead error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to mark read" });
    }
});
exports.markRead = markRead;
/** DELETE /messages/:id */
const deleteMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const id = String(req.params.id || "");
        const existing = yield prisma_1.prisma.message.findFirst({
            where: {
                messageid: id,
                OR: [{ senderId: userId }, { recipientId: userId }],
            },
        });
        if (!existing) {
            res.status(404).json({ isSuccess: false, message: "Message not found" });
            return;
        }
        yield prisma_1.prisma.message.delete({ where: { messageid: id } });
        res.status(200).json({ isSuccess: true, message: "Message deleted" });
    }
    catch (error) {
        console.error("deleteMessage error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to delete message" });
    }
});
exports.deleteMessage = deleteMessage;
