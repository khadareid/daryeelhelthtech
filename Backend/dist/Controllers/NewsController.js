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
exports.moderateNews = exports.reviewNewsReport = exports.listNewsReports = exports.reportNews = exports.removeReaction = exports.addReaction = exports.deleteComment = exports.updateComment = exports.addComment = exports.deleteNews = exports.updateNews = exports.createNews = exports.getNews = exports.listNews = void 0;
exports.authorBadge = authorBadge;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const audit_service_1 = require("../services/audit.service");
const featureFlag_service_1 = require("../services/featureFlag.service");
function actor(req) {
    const user = req.user;
    return {
        userId: ((user === null || user === void 0 ? void 0 : user.userId) || (user === null || user === void 0 ? void 0 : user.userid) || (user === null || user === void 0 ? void 0 : user.id) || null),
        role: ((user === null || user === void 0 ? void 0 : user.role) || null),
    };
}
function sanitize(text, max = 5000) {
    return text.replace(/<[^>]*>/g, "").trim().slice(0, max);
}
const VERIFIED_ROLES = [
    client_1.Role.DOCTOR,
    client_1.Role.NURSE,
    client_1.Role.MIDWIFE,
    client_1.Role.LAB_TECH,
    client_1.Role.PHARMACIST,
    client_1.Role.SUPER_ADMIN,
    client_1.Role.ADMIN,
];
function authorBadge(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const [user, profile] = yield Promise.all([
            prisma_1.prisma.user.findUnique({
                where: { userid: userId },
                select: { fullName: true, role: true, avatarUrl: true, picture: true },
            }),
            prisma_1.prisma.professionalProfile.findUnique({
                where: { userId },
                select: { isVerified: true, specialization: true, professionalType: true },
            }),
        ]);
        return {
            fullName: (user === null || user === void 0 ? void 0 : user.fullName) || "User",
            role: user === null || user === void 0 ? void 0 : user.role,
            avatarUrl: (user === null || user === void 0 ? void 0 : user.avatarUrl) || (user === null || user === void 0 ? void 0 : user.picture),
            verifiedProfessional: Boolean((profile === null || profile === void 0 ? void 0 : profile.isVerified) && user && VERIFIED_ROLES.includes(user.role)),
            specialization: (profile === null || profile === void 0 ? void 0 : profile.specialization) || null,
        };
    });
}
/** GET /news — public feed */
const listNews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 10));
        const category = String(req.query.category || "").trim();
        const search = String(req.query.search || "").trim();
        const { userId, role } = actor(req);
        const feedAllowed = yield (0, featureFlag_service_1.isFeatureAllowed)({
            key: "news_feed",
            userId,
            role,
            action: "read",
        });
        if (!feedAllowed) {
            res.status(403).json({ isSuccess: false, message: "News feed is disabled" });
            return;
        }
        const where = {
            status: client_1.NewsPostStatus.PUBLISHED,
            deletedAt: null,
            visibility: {
                in: userId
                    ? [client_1.NewsVisibility.PUBLIC, client_1.NewsVisibility.AUTHENTICATED]
                    : [client_1.NewsVisibility.PUBLIC],
            },
        };
        if (category && Object.values(client_1.NewsCategory).includes(category)) {
            where.category = category;
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
            ];
        }
        const [total, posts] = yield Promise.all([
            prisma_1.prisma.newsPost.count({ where }),
            prisma_1.prisma.newsPost.findMany({
                where,
                orderBy: [{ isOfficial: "desc" }, { publishedAt: "desc" }],
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    author: {
                        select: {
                            userid: true,
                            fullName: true,
                            role: true,
                            avatarUrl: true,
                            picture: true,
                            professionalProfiles: {
                                select: { isVerified: true, specialization: true },
                                take: 1,
                            },
                        },
                    },
                    _count: { select: { comments: true, reactions: true } },
                },
            }),
        ]);
        res.status(200).json({
            isSuccess: true,
            data: posts.map((p) => {
                var _a, _b;
                return (Object.assign(Object.assign({}, p), { author: {
                        userid: p.author.userid,
                        fullName: p.author.fullName,
                        role: p.author.role,
                        avatarUrl: p.author.avatarUrl || p.author.picture,
                        verifiedProfessional: Boolean(((_a = p.author.professionalProfiles[0]) === null || _a === void 0 ? void 0 : _a.isVerified) &&
                            VERIFIED_ROLES.includes(p.author.role)),
                        specialization: (_b = p.author.professionalProfiles[0]) === null || _b === void 0 ? void 0 : _b.specialization,
                    }, commentCount: p._count.comments, reactionCount: p._count.reactions }));
            }),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    }
    catch (error) {
        console.error("listNews error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load news" });
    }
});
exports.listNews = listNews;
/** GET /news/:id */
const getNews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = String(req.params.id);
        const { userId } = actor(req);
        const post = yield prisma_1.prisma.newsPost.findFirst({
            where: { newspostid: id, deletedAt: null },
            include: {
                author: {
                    select: {
                        userid: true,
                        fullName: true,
                        role: true,
                        avatarUrl: true,
                        picture: true,
                        professionalProfiles: {
                            select: { isVerified: true, specialization: true },
                            take: 1,
                        },
                    },
                },
                comments: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: "asc" },
                    take: 100,
                    include: {
                        author: {
                            select: { userid: true, fullName: true, avatarUrl: true, picture: true },
                        },
                    },
                },
                _count: { select: { reactions: true, comments: true } },
            },
        });
        if (!post) {
            res.status(404).json({ isSuccess: false, message: "Post not found" });
            return;
        }
        const isOwner = userId === post.authorId;
        const isAdmin = actor(req).role === client_1.Role.SUPER_ADMIN || actor(req).role === client_1.Role.ADMIN;
        if (post.status !== client_1.NewsPostStatus.PUBLISHED &&
            !isOwner &&
            !isAdmin) {
            res.status(404).json({ isSuccess: false, message: "Post not found" });
            return;
        }
        let myReaction = null;
        if (userId) {
            myReaction = yield prisma_1.prisma.newsReaction.findUnique({
                where: { postId_userId: { postId: id, userId } },
            });
        }
        res.status(200).json({
            isSuccess: true,
            result: Object.assign(Object.assign({}, post), { author: Object.assign(Object.assign({}, post.author), { verifiedProfessional: Boolean(((_a = post.author.professionalProfiles[0]) === null || _a === void 0 ? void 0 : _a.isVerified) &&
                        VERIFIED_ROLES.includes(post.author.role)) }), myReaction, reactionCount: post._count.reactions, commentCount: post._count.comments }),
        });
    }
    catch (error) {
        console.error("getNews error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load post" });
    }
});
exports.getNews = getNews;
/** POST /news */
const createNews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId, role } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const allowed = yield (0, featureFlag_service_1.isFeatureAllowed)({
            key: "news_feed",
            userId,
            role,
            action: "create",
        });
        if (!allowed) {
            res.status(403).json({ isSuccess: false, message: "Posting is disabled" });
            return;
        }
        const { title, content, category, status, visibility, coverImageUrl, isOfficial } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        if (!title || !content) {
            res.status(400).json({ isSuccess: false, message: "title and content are required" });
            return;
        }
        const publish = status === client_1.NewsPostStatus.PUBLISHED || status === "PUBLISHED";
        const official = Boolean(isOfficial) &&
            (role === client_1.Role.SUPER_ADMIN || role === client_1.Role.ADMIN);
        const post = yield prisma_1.prisma.newsPost.create({
            data: {
                authorId: userId,
                title: sanitize(String(title), 200),
                content: sanitize(String(content), 20000),
                category: category && Object.values(client_1.NewsCategory).includes(category)
                    ? category
                    : client_1.NewsCategory.HEALTH_NEWS,
                status: publish ? client_1.NewsPostStatus.PUBLISHED : client_1.NewsPostStatus.DRAFT,
                visibility: visibility && Object.values(client_1.NewsVisibility).includes(visibility)
                    ? visibility
                    : client_1.NewsVisibility.PUBLIC,
                coverImageUrl: coverImageUrl ? String(coverImageUrl).slice(0, 500) : null,
                isOfficial: official,
                publishedAt: publish ? new Date() : null,
            },
        });
        res.status(201).json({ isSuccess: true, result: post });
    }
    catch (error) {
        console.error("createNews error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to create post" });
    }
});
exports.createNews = createNews;
/** PATCH /news/:id */
const updateNews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId, role } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const id = String(req.params.id);
        const post = yield prisma_1.prisma.newsPost.findUnique({ where: { newspostid: id } });
        if (!post || post.deletedAt) {
            res.status(404).json({ isSuccess: false, message: "Post not found" });
            return;
        }
        const isAdmin = role === client_1.Role.SUPER_ADMIN || role === client_1.Role.ADMIN;
        if (post.authorId !== userId && !isAdmin) {
            res.status(403).json({ isSuccess: false, message: "Not allowed" });
            return;
        }
        const { title, content, category, status, visibility, coverImageUrl } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const data = {};
        if (title)
            data.title = sanitize(String(title), 200);
        if (content)
            data.content = sanitize(String(content), 20000);
        if (category)
            data.category = category;
        if (visibility)
            data.visibility = visibility;
        if (coverImageUrl !== undefined)
            data.coverImageUrl = coverImageUrl;
        if (status) {
            data.status = status;
            if (status === client_1.NewsPostStatus.PUBLISHED && !post.publishedAt) {
                data.publishedAt = new Date();
            }
        }
        const updated = yield prisma_1.prisma.newsPost.update({
            where: { newspostid: id },
            data,
        });
        res.status(200).json({ isSuccess: true, result: updated });
    }
    catch (error) {
        console.error("updateNews error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to update post" });
    }
});
exports.updateNews = updateNews;
/** DELETE /news/:id — soft delete */
const deleteNews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, role } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const id = String(req.params.id);
        const post = yield prisma_1.prisma.newsPost.findUnique({ where: { newspostid: id } });
        if (!post) {
            res.status(404).json({ isSuccess: false, message: "Post not found" });
            return;
        }
        const isAdmin = role === client_1.Role.SUPER_ADMIN || role === client_1.Role.ADMIN;
        if (post.authorId !== userId && !isAdmin) {
            res.status(403).json({ isSuccess: false, message: "Not allowed" });
            return;
        }
        yield prisma_1.prisma.newsPost.update({
            where: { newspostid: id },
            data: { deletedAt: new Date(), status: client_1.NewsPostStatus.REMOVED },
        });
        res.status(200).json({ isSuccess: true, message: "Post removed" });
    }
    catch (error) {
        console.error("deleteNews error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to delete post" });
    }
});
exports.deleteNews = deleteNews;
/** POST /news/:id/comments */
const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { userId, role } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const allowed = yield (0, featureFlag_service_1.isFeatureAllowed)({
            key: "news_comments",
            userId,
            role,
            action: "create",
        });
        if (!allowed) {
            res.status(403).json({ isSuccess: false, message: "Comments disabled" });
            return;
        }
        const id = String(req.params.id);
        const content = sanitize(String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.content) || ""), 2000);
        if (!content) {
            res.status(400).json({ isSuccess: false, message: "content required" });
            return;
        }
        const post = yield prisma_1.prisma.newsPost.findFirst({
            where: { newspostid: id, status: client_1.NewsPostStatus.PUBLISHED, deletedAt: null },
        });
        if (!post) {
            res.status(404).json({ isSuccess: false, message: "Post not found" });
            return;
        }
        const comment = yield prisma_1.prisma.newsComment.create({
            data: {
                postId: id,
                authorId: userId,
                content,
                parentCommentId: ((_b = req.body) === null || _b === void 0 ? void 0 : _b.parentCommentId) || null,
            },
        });
        res.status(201).json({ isSuccess: true, result: comment });
    }
    catch (error) {
        console.error("addComment error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to comment" });
    }
});
exports.addComment = addComment;
/** PATCH /news/comments/:commentId */
const updateComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId, role } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const commentId = String(req.params.commentId);
        const comment = yield prisma_1.prisma.newsComment.findUnique({
            where: { newscommentid: commentId },
        });
        if (!comment || comment.deletedAt) {
            res.status(404).json({ isSuccess: false, message: "Comment not found" });
            return;
        }
        const isAdmin = role === client_1.Role.SUPER_ADMIN || role === client_1.Role.ADMIN;
        if (comment.authorId !== userId && !isAdmin) {
            res.status(403).json({ isSuccess: false, message: "Not allowed" });
            return;
        }
        const content = sanitize(String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.content) || ""), 2000);
        const updated = yield prisma_1.prisma.newsComment.update({
            where: { newscommentid: commentId },
            data: { content },
        });
        res.status(200).json({ isSuccess: true, result: updated });
    }
    catch (error) {
        console.error("updateComment error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to update comment" });
    }
});
exports.updateComment = updateComment;
/** DELETE /news/comments/:commentId */
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, role } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const commentId = String(req.params.commentId);
        const comment = yield prisma_1.prisma.newsComment.findUnique({
            where: { newscommentid: commentId },
        });
        if (!comment) {
            res.status(404).json({ isSuccess: false, message: "Comment not found" });
            return;
        }
        const isAdmin = role === client_1.Role.SUPER_ADMIN || role === client_1.Role.ADMIN;
        if (comment.authorId !== userId && !isAdmin) {
            res.status(403).json({ isSuccess: false, message: "Not allowed" });
            return;
        }
        yield prisma_1.prisma.newsComment.update({
            where: { newscommentid: commentId },
            data: { deletedAt: new Date() },
        });
        res.status(200).json({ isSuccess: true, message: "Comment deleted" });
    }
    catch (error) {
        console.error("deleteComment error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to delete comment" });
    }
});
exports.deleteComment = deleteComment;
/** POST /news/:id/reactions */
const addReaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId, role } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const allowed = yield (0, featureFlag_service_1.isFeatureAllowed)({
            key: "news_reactions",
            userId,
            role,
            action: "create",
        });
        if (!allowed) {
            res.status(403).json({ isSuccess: false, message: "Reactions disabled" });
            return;
        }
        const id = String(req.params.id);
        const reactionType = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.reactionType) &&
            Object.values(client_1.NewsReactionType).includes(req.body.reactionType)
            ? req.body.reactionType
            : client_1.NewsReactionType.LIKE;
        const reaction = yield prisma_1.prisma.newsReaction.upsert({
            where: { postId_userId: { postId: id, userId } },
            create: { postId: id, userId, reactionType },
            update: { reactionType },
        });
        res.status(200).json({ isSuccess: true, result: reaction });
    }
    catch (error) {
        console.error("addReaction error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to react" });
    }
});
exports.addReaction = addReaction;
/** DELETE /news/:id/reactions */
const removeReaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const id = String(req.params.id);
        yield prisma_1.prisma.newsReaction.deleteMany({ where: { postId: id, userId } });
        res.status(200).json({ isSuccess: true, message: "Reaction removed" });
    }
    catch (error) {
        console.error("removeReaction error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to remove reaction" });
    }
});
exports.removeReaction = removeReaction;
/** POST /news/reports */
const reportNews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const { postId, commentId, reason, details } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        if (!postId && !commentId) {
            res.status(400).json({ isSuccess: false, message: "postId or commentId required" });
            return;
        }
        if (!reason || !Object.values(client_1.NewsReportReason).includes(reason)) {
            res.status(400).json({ isSuccess: false, message: "Valid reason required" });
            return;
        }
        const report = yield prisma_1.prisma.newsReport.create({
            data: {
                postId: postId || null,
                commentId: commentId || null,
                reporterId: userId,
                reason,
                details: details ? sanitize(String(details), 2000) : null,
            },
        });
        res.status(201).json({ isSuccess: true, result: report });
    }
    catch (error) {
        console.error("reportNews error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to report" });
    }
});
exports.reportNews = reportNews;
/** GET /admin/news/reports */
const listNewsReports = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reports = yield prisma_1.prisma.newsReport.findMany({
            where: { status: { in: [client_1.NewsReportStatus.OPEN, client_1.NewsReportStatus.UNDER_REVIEW] } },
            orderBy: { createdAt: "desc" },
            take: 100,
            include: {
                post: { select: { newspostid: true, title: true, status: true } },
                comment: { select: { newscommentid: true, content: true } },
                reporter: { select: { userid: true, fullName: true, email: true } },
            },
        });
        res.status(200).json({ isSuccess: true, result: reports });
    }
    catch (error) {
        console.error("listNewsReports error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load reports" });
    }
});
exports.listNewsReports = listNewsReports;
/** PATCH /admin/news/reports/:id */
const reviewNewsReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId: adminId } = actor(req);
        const id = String(req.params.id);
        const { status, reviewNotes, hideContent } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const report = yield prisma_1.prisma.newsReport.update({
            where: { newsreportid: id },
            data: {
                status: status || client_1.NewsReportStatus.RESOLVED,
                reviewNotes: reviewNotes ? String(reviewNotes) : null,
                reviewedById: adminId,
                reviewedAt: new Date(),
            },
        });
        if (hideContent && report.postId) {
            yield prisma_1.prisma.newsPost.update({
                where: { newspostid: report.postId },
                data: { status: client_1.NewsPostStatus.HIDDEN },
            });
            const post = yield prisma_1.prisma.newsPost.findUnique({
                where: { newspostid: report.postId },
            });
            if (post) {
                yield prisma_1.prisma.notification.create({
                    data: {
                        userId: post.authorId,
                        title: "Post moderation",
                        body: "Your post was hidden after a moderation review.",
                        type: client_1.NotificationType.MODERATION,
                        channel: client_1.NotificationChannel.IN_APP,
                        metadata: { postId: post.newspostid },
                    },
                });
            }
        }
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId: adminId || undefined, action: "NEWS_REPORT_REVIEW", entity: "NewsReport", entityId: id, metadata: { status, hideContent: Boolean(hideContent) } }, (0, audit_service_1.getClientMeta)(req)));
        res.status(200).json({ isSuccess: true, result: report });
    }
    catch (error) {
        console.error("reviewNewsReport error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to review report" });
    }
});
exports.reviewNewsReport = reviewNewsReport;
/** PATCH /admin/news/:id/moderation */
const moderateNews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId: adminId } = actor(req);
        const id = String(req.params.id);
        const { status, reason } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        if (!status || !Object.values(client_1.NewsPostStatus).includes(status)) {
            res.status(400).json({ isSuccess: false, message: "Valid status required" });
            return;
        }
        const post = yield prisma_1.prisma.newsPost.update({
            where: { newspostid: id },
            data: { status },
        });
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId: adminId || undefined, action: "NEWS_MODERATION", entity: "NewsPost", entityId: id, metadata: { status, reason } }, (0, audit_service_1.getClientMeta)(req)));
        res.status(200).json({ isSuccess: true, result: post });
    }
    catch (error) {
        console.error("moderateNews error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to moderate" });
    }
});
exports.moderateNews = moderateNews;
