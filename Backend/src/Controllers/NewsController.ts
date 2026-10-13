import { Request, Response } from "express";
import {
  NewsCategory,
  NewsPostStatus,
  NewsReactionType,
  NewsReportReason,
  NewsReportStatus,
  NewsVisibility,
  NotificationChannel,
  NotificationType,
  Role,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createAuditLog, getClientMeta } from "../services/audit.service";
import { isFeatureAllowed } from "../services/featureFlag.service";

function actor(req: Request) {
  const user = (req as any).user;
  return {
    userId: (user?.userId || user?.userid || user?.id || null) as string | null,
    role: (user?.role || null) as Role | null,
  };
}

function sanitize(text: string, max = 5000) {
  return text.replace(/<[^>]*>/g, "").trim().slice(0, max);
}

const VERIFIED_ROLES: Role[] = [
  Role.DOCTOR,
  Role.NURSE,
  Role.MIDWIFE,
  Role.LAB_TECH,
  Role.PHARMACIST,
  Role.SUPER_ADMIN,
  Role.ADMIN,
];

async function authorBadge(userId: string) {
  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { userid: userId },
      select: { fullName: true, role: true, avatarUrl: true, picture: true },
    }),
    prisma.professionalProfile.findUnique({
      where: { userId },
      select: { isVerified: true, specialization: true, professionalType: true },
    }),
  ]);
  return {
    fullName: user?.fullName || "User",
    role: user?.role,
    avatarUrl: user?.avatarUrl || user?.picture,
    verifiedProfessional: Boolean(
      profile?.isVerified && user && VERIFIED_ROLES.includes(user.role),
    ),
    specialization: profile?.specialization || null,
  };
}

/** GET /news — public feed */
export const listNews = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 10));
    const category = String(req.query.category || "").trim();
    const search = String(req.query.search || "").trim();
    const { userId, role } = actor(req);

    const feedAllowed = await isFeatureAllowed({
      key: "news_feed",
      userId,
      role,
      action: "read",
    });
    if (!feedAllowed) {
      res.status(403).json({ isSuccess: false, message: "News feed is disabled" });
      return;
    }

    const where: any = {
      status: NewsPostStatus.PUBLISHED,
      deletedAt: null,
      visibility: {
        in: userId
          ? [NewsVisibility.PUBLIC, NewsVisibility.AUTHENTICATED]
          : [NewsVisibility.PUBLIC],
      },
    };
    if (category && Object.values(NewsCategory).includes(category as NewsCategory)) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, posts] = await Promise.all([
      prisma.newsPost.count({ where }),
      prisma.newsPost.findMany({
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
      data: posts.map((p) => ({
        ...p,
        author: {
          userid: p.author.userid,
          fullName: p.author.fullName,
          role: p.author.role,
          avatarUrl: p.author.avatarUrl || p.author.picture,
          verifiedProfessional: Boolean(
            p.author.professionalProfiles[0]?.isVerified &&
              VERIFIED_ROLES.includes(p.author.role),
          ),
          specialization: p.author.professionalProfiles[0]?.specialization,
        },
        commentCount: p._count.comments,
        reactionCount: p._count.reactions,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("listNews error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load news" });
  }
};

/** GET /news/:id */
export const getNews = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { userId } = actor(req);
    const post = await prisma.newsPost.findFirst({
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
    const isAdmin =
      actor(req).role === Role.SUPER_ADMIN || actor(req).role === Role.ADMIN;
    if (
      post.status !== NewsPostStatus.PUBLISHED &&
      !isOwner &&
      !isAdmin
    ) {
      res.status(404).json({ isSuccess: false, message: "Post not found" });
      return;
    }

    let myReaction = null;
    if (userId) {
      myReaction = await prisma.newsReaction.findUnique({
        where: { postId_userId: { postId: id, userId } },
      });
    }

    res.status(200).json({
      isSuccess: true,
      result: {
        ...post,
        author: {
          ...post.author,
          verifiedProfessional: Boolean(
            post.author.professionalProfiles[0]?.isVerified &&
              VERIFIED_ROLES.includes(post.author.role),
          ),
        },
        myReaction,
        reactionCount: post._count.reactions,
        commentCount: post._count.comments,
      },
    });
  } catch (error) {
    console.error("getNews error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load post" });
  }
};

/** POST /news */
export const createNews = async (req: Request, res: Response) => {
  try {
    const { userId, role } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const allowed = await isFeatureAllowed({
      key: "news_feed",
      userId,
      role,
      action: "create",
    });
    if (!allowed) {
      res.status(403).json({ isSuccess: false, message: "Posting is disabled" });
      return;
    }

    const { title, content, category, status, visibility, coverImageUrl, isOfficial } =
      req.body ?? {};
    if (!title || !content) {
      res.status(400).json({ isSuccess: false, message: "title and content are required" });
      return;
    }

    const publish =
      status === NewsPostStatus.PUBLISHED || status === "PUBLISHED";
    const official =
      Boolean(isOfficial) &&
      (role === Role.SUPER_ADMIN || role === Role.ADMIN);

    const post = await prisma.newsPost.create({
      data: {
        authorId: userId,
        title: sanitize(String(title), 200),
        content: sanitize(String(content), 20000),
        category:
          category && Object.values(NewsCategory).includes(category)
            ? category
            : NewsCategory.HEALTH_NEWS,
        status: publish ? NewsPostStatus.PUBLISHED : NewsPostStatus.DRAFT,
        visibility:
          visibility && Object.values(NewsVisibility).includes(visibility)
            ? visibility
            : NewsVisibility.PUBLIC,
        coverImageUrl: coverImageUrl ? String(coverImageUrl).slice(0, 500) : null,
        isOfficial: official,
        publishedAt: publish ? new Date() : null,
      },
    });

    res.status(201).json({ isSuccess: true, result: post });
  } catch (error) {
    console.error("createNews error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to create post" });
  }
};

/** PATCH /news/:id */
export const updateNews = async (req: Request, res: Response) => {
  try {
    const { userId, role } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const id = String(req.params.id);
    const post = await prisma.newsPost.findUnique({ where: { newspostid: id } });
    if (!post || post.deletedAt) {
      res.status(404).json({ isSuccess: false, message: "Post not found" });
      return;
    }
    const isAdmin = role === Role.SUPER_ADMIN || role === Role.ADMIN;
    if (post.authorId !== userId && !isAdmin) {
      res.status(403).json({ isSuccess: false, message: "Not allowed" });
      return;
    }

    const { title, content, category, status, visibility, coverImageUrl } =
      req.body ?? {};
    const data: any = {};
    if (title) data.title = sanitize(String(title), 200);
    if (content) data.content = sanitize(String(content), 20000);
    if (category) data.category = category;
    if (visibility) data.visibility = visibility;
    if (coverImageUrl !== undefined) data.coverImageUrl = coverImageUrl;
    if (status) {
      data.status = status;
      if (status === NewsPostStatus.PUBLISHED && !post.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const updated = await prisma.newsPost.update({
      where: { newspostid: id },
      data,
    });
    res.status(200).json({ isSuccess: true, result: updated });
  } catch (error) {
    console.error("updateNews error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to update post" });
  }
};

/** DELETE /news/:id — soft delete */
export const deleteNews = async (req: Request, res: Response) => {
  try {
    const { userId, role } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const id = String(req.params.id);
    const post = await prisma.newsPost.findUnique({ where: { newspostid: id } });
    if (!post) {
      res.status(404).json({ isSuccess: false, message: "Post not found" });
      return;
    }
    const isAdmin = role === Role.SUPER_ADMIN || role === Role.ADMIN;
    if (post.authorId !== userId && !isAdmin) {
      res.status(403).json({ isSuccess: false, message: "Not allowed" });
      return;
    }
    await prisma.newsPost.update({
      where: { newspostid: id },
      data: { deletedAt: new Date(), status: NewsPostStatus.REMOVED },
    });
    res.status(200).json({ isSuccess: true, message: "Post removed" });
  } catch (error) {
    console.error("deleteNews error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to delete post" });
  }
};

/** POST /news/:id/comments */
export const addComment = async (req: Request, res: Response) => {
  try {
    const { userId, role } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const allowed = await isFeatureAllowed({
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
    const content = sanitize(String(req.body?.content || ""), 2000);
    if (!content) {
      res.status(400).json({ isSuccess: false, message: "content required" });
      return;
    }
    const post = await prisma.newsPost.findFirst({
      where: { newspostid: id, status: NewsPostStatus.PUBLISHED, deletedAt: null },
    });
    if (!post) {
      res.status(404).json({ isSuccess: false, message: "Post not found" });
      return;
    }

    const comment = await prisma.newsComment.create({
      data: {
        postId: id,
        authorId: userId,
        content,
        parentCommentId: req.body?.parentCommentId || null,
      },
    });
    res.status(201).json({ isSuccess: true, result: comment });
  } catch (error) {
    console.error("addComment error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to comment" });
  }
};

/** PATCH /news/comments/:commentId */
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { userId, role } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const commentId = String(req.params.commentId);
    const comment = await prisma.newsComment.findUnique({
      where: { newscommentid: commentId },
    });
    if (!comment || comment.deletedAt) {
      res.status(404).json({ isSuccess: false, message: "Comment not found" });
      return;
    }
    const isAdmin = role === Role.SUPER_ADMIN || role === Role.ADMIN;
    if (comment.authorId !== userId && !isAdmin) {
      res.status(403).json({ isSuccess: false, message: "Not allowed" });
      return;
    }
    const content = sanitize(String(req.body?.content || ""), 2000);
    const updated = await prisma.newsComment.update({
      where: { newscommentid: commentId },
      data: { content },
    });
    res.status(200).json({ isSuccess: true, result: updated });
  } catch (error) {
    console.error("updateComment error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to update comment" });
  }
};

/** DELETE /news/comments/:commentId */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { userId, role } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const commentId = String(req.params.commentId);
    const comment = await prisma.newsComment.findUnique({
      where: { newscommentid: commentId },
    });
    if (!comment) {
      res.status(404).json({ isSuccess: false, message: "Comment not found" });
      return;
    }
    const isAdmin = role === Role.SUPER_ADMIN || role === Role.ADMIN;
    if (comment.authorId !== userId && !isAdmin) {
      res.status(403).json({ isSuccess: false, message: "Not allowed" });
      return;
    }
    await prisma.newsComment.update({
      where: { newscommentid: commentId },
      data: { deletedAt: new Date() },
    });
    res.status(200).json({ isSuccess: true, message: "Comment deleted" });
  } catch (error) {
    console.error("deleteComment error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to delete comment" });
  }
};

/** POST /news/:id/reactions */
export const addReaction = async (req: Request, res: Response) => {
  try {
    const { userId, role } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const allowed = await isFeatureAllowed({
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
    const reactionType =
      req.body?.reactionType &&
      Object.values(NewsReactionType).includes(req.body.reactionType)
        ? req.body.reactionType
        : NewsReactionType.LIKE;

    const reaction = await prisma.newsReaction.upsert({
      where: { postId_userId: { postId: id, userId } },
      create: { postId: id, userId, reactionType },
      update: { reactionType },
    });
    res.status(200).json({ isSuccess: true, result: reaction });
  } catch (error) {
    console.error("addReaction error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to react" });
  }
};

/** DELETE /news/:id/reactions */
export const removeReaction = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const id = String(req.params.id);
    await prisma.newsReaction.deleteMany({ where: { postId: id, userId } });
    res.status(200).json({ isSuccess: true, message: "Reaction removed" });
  } catch (error) {
    console.error("removeReaction error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to remove reaction" });
  }
};

/** POST /news/reports */
export const reportNews = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const { postId, commentId, reason, details } = req.body ?? {};
    if (!postId && !commentId) {
      res.status(400).json({ isSuccess: false, message: "postId or commentId required" });
      return;
    }
    if (!reason || !Object.values(NewsReportReason).includes(reason)) {
      res.status(400).json({ isSuccess: false, message: "Valid reason required" });
      return;
    }
    const report = await prisma.newsReport.create({
      data: {
        postId: postId || null,
        commentId: commentId || null,
        reporterId: userId,
        reason,
        details: details ? sanitize(String(details), 2000) : null,
      },
    });
    res.status(201).json({ isSuccess: true, result: report });
  } catch (error) {
    console.error("reportNews error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to report" });
  }
};

/** GET /admin/news/reports */
export const listNewsReports = async (_req: Request, res: Response) => {
  try {
    const reports = await prisma.newsReport.findMany({
      where: { status: { in: [NewsReportStatus.OPEN, NewsReportStatus.UNDER_REVIEW] } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        post: { select: { newspostid: true, title: true, status: true } },
        comment: { select: { newscommentid: true, content: true } },
        reporter: { select: { userid: true, fullName: true, email: true } },
      },
    });
    res.status(200).json({ isSuccess: true, result: reports });
  } catch (error) {
    console.error("listNewsReports error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load reports" });
  }
};

/** PATCH /admin/news/reports/:id */
export const reviewNewsReport = async (req: Request, res: Response) => {
  try {
    const { userId: adminId } = actor(req);
    const id = String(req.params.id);
    const { status, reviewNotes, hideContent } = req.body ?? {};
    const report = await prisma.newsReport.update({
      where: { newsreportid: id },
      data: {
        status: status || NewsReportStatus.RESOLVED,
        reviewNotes: reviewNotes ? String(reviewNotes) : null,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    if (hideContent && report.postId) {
      await prisma.newsPost.update({
        where: { newspostid: report.postId },
        data: { status: NewsPostStatus.HIDDEN },
      });
      const post = await prisma.newsPost.findUnique({
        where: { newspostid: report.postId },
      });
      if (post) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            title: "Post moderation",
            body: "Your post was hidden after a moderation review.",
            type: NotificationType.MODERATION,
            channel: NotificationChannel.IN_APP,
            metadata: { postId: post.newspostid },
          },
        });
      }
    }

    await createAuditLog({
      userId: adminId || undefined,
      action: "NEWS_REPORT_REVIEW",
      entity: "NewsReport",
      entityId: id,
      metadata: { status, hideContent: Boolean(hideContent) },
      ...getClientMeta(req),
    });

    res.status(200).json({ isSuccess: true, result: report });
  } catch (error) {
    console.error("reviewNewsReport error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to review report" });
  }
};

/** PATCH /admin/news/:id/moderation */
export const moderateNews = async (req: Request, res: Response) => {
  try {
    const { userId: adminId } = actor(req);
    const id = String(req.params.id);
    const { status, reason } = req.body ?? {};
    if (!status || !Object.values(NewsPostStatus).includes(status)) {
      res.status(400).json({ isSuccess: false, message: "Valid status required" });
      return;
    }
    const post = await prisma.newsPost.update({
      where: { newspostid: id },
      data: { status },
    });
    await createAuditLog({
      userId: adminId || undefined,
      action: "NEWS_MODERATION",
      entity: "NewsPost",
      entityId: id,
      metadata: { status, reason },
      ...getClientMeta(req),
    });
    res.status(200).json({ isSuccess: true, result: post });
  } catch (error) {
    console.error("moderateNews error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to moderate" });
  }
};

export { authorBadge };
