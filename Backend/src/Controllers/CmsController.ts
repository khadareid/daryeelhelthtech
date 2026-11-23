import { Request, Response } from "express";
import { CmsPageStatus, TeamMemberCategory } from "@prisma/client";
import {
  createPage,
  createTeamMember,
  deletePage,
  deleteTeamMember,
  ensureCatalogPages,
  getAdminPage,
  getAdminTeamMember,
  getPublicCmsBundle,
  getPublicPage,
  getPublicTeamGrouped,
  listAdminPages,
  listAdminTeam,
  listPublicPages,
  listPublicSettings,
  updatePage,
  updateTeamMember,
  upsertBranding,
} from "../services/cms.service";
import { handleRouteError } from "../utils/errors";
import { created, ok } from "../utils/response";

function parseCategory(raw?: string): TeamMemberCategory | undefined {
  if (!raw) return undefined;
  const value = String(raw).toUpperCase();
  return Object.values(TeamMemberCategory).includes(value as TeamMemberCategory)
    ? (value as TeamMemberCategory)
    : undefined;
}

export const publicBundle = async (_req: Request, res: Response) => {
  try {
    ok(res, await getPublicCmsBundle());
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const publicSettings = async (_req: Request, res: Response) => {
  try {
    ok(res, await listPublicSettings());
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const publicPages = async (_req: Request, res: Response) => {
  try {
    ok(res, await listPublicPages());
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const publicPage = async (req: Request, res: Response) => {
  try {
    ok(res, await getPublicPage(req.params.slug));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const publicTeam = async (req: Request, res: Response) => {
  try {
    ok(res, await getPublicTeamGrouped());
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminListPages = async (_req: Request, res: Response) => {
  try {
    ok(res, await listAdminPages());
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminGetPage = async (req: Request, res: Response) => {
  try {
    ok(res, await getAdminPage(req.params.id));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminEnsurePages = async (req: Request, res: Response) => {
  try {
    const userId = (req as { user?: { userId?: string } }).user?.userId;
    ok(res, await ensureCatalogPages(userId), "All site pages ready");
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminCreatePage = async (req: Request, res: Response) => {
  try {
    const userId = (req as { user?: { userId?: string } }).user?.userId;
    const body = req.body || {};
    created(
      res,
      await createPage(
        {
          slug: body.slug,
          title: body.title,
          subtitle: body.subtitle,
          summary: body.summary,
          heroImageUrl: body.heroImageUrl,
          body: body.body,
          highlights: body.highlights,
          quote: body.quote,
          cta: body.cta,
          locale: body.locale || "en",
          status: body.status || CmsPageStatus.DRAFT,
          sortOrder: Number(body.sortOrder ?? 0),
        },
        userId
      ),
      "Page created"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminUpdatePage = async (req: Request, res: Response) => {
  try {
    const userId = (req as { user?: { userId?: string } }).user?.userId;
    const body = req.body || {};
    ok(
      res,
      await updatePage(
        req.params.id,
        {
          slug: body.slug,
          title: body.title,
          subtitle: body.subtitle,
          summary: body.summary,
          heroImageUrl: body.heroImageUrl,
          body: body.body,
          highlights: body.highlights,
          quote: body.quote,
          cta: body.cta,
          locale: body.locale,
          status: body.status,
          sortOrder:
            body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        },
        userId
      ),
      "Page updated"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminDeletePage = async (req: Request, res: Response) => {
  try {
    ok(res, await deletePage(req.params.id), "Page deleted");
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminListTeam = async (req: Request, res: Response) => {
  try {
    ok(res, await listAdminTeam(parseCategory(req.query.category as string)));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminGetTeamMember = async (req: Request, res: Response) => {
  try {
    ok(res, await getAdminTeamMember(req.params.id));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminCreateTeamMember = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    created(
      res,
      await createTeamMember({
        fullName: body.fullName,
        title: body.title,
        slug: body.slug,
        department: body.department,
        category: parseCategory(body.category) || TeamMemberCategory.STAFF,
        bio: body.bio,
        email: body.email,
        phone: body.phone,
        photoUrl: body.photoUrl,
        expertise: Array.isArray(body.expertise)
          ? body.expertise
          : typeof body.expertise === "string"
            ? body.expertise
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
        education: body.education,
        yearsExperience:
          body.yearsExperience !== undefined && body.yearsExperience !== ""
            ? Number(body.yearsExperience)
            : null,
        socialLinks: body.socialLinks,
        sortOrder: Number(body.sortOrder ?? 0),
        isPublished: body.isPublished !== false,
        isFeatured: Boolean(body.isFeatured),
      }),
      "Team member created"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminUpdateTeamMember = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const expertise = Array.isArray(body.expertise)
      ? body.expertise
      : typeof body.expertise === "string"
        ? body.expertise
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : undefined;

    ok(
      res,
      await updateTeamMember(req.params.id, {
        fullName: body.fullName,
        title: body.title,
        slug: body.slug,
        department: body.department,
        category: parseCategory(body.category),
        bio: body.bio,
        email: body.email,
        phone: body.phone,
        photoUrl: body.photoUrl,
        expertise,
        education: body.education,
        yearsExperience:
          body.yearsExperience !== undefined && body.yearsExperience !== ""
            ? Number(body.yearsExperience)
            : body.yearsExperience === null
              ? null
              : undefined,
        socialLinks: body.socialLinks,
        sortOrder:
          body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        isPublished:
          body.isPublished !== undefined ? Boolean(body.isPublished) : undefined,
        isFeatured:
          body.isFeatured !== undefined ? Boolean(body.isFeatured) : undefined,
      }),
      "Team member updated"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminDeleteTeamMember = async (req: Request, res: Response) => {
  try {
    ok(res, await deleteTeamMember(req.params.id), "Team member deleted");
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminUpdateBranding = async (req: Request, res: Response) => {
  try {
    const userId = (req as { user?: { userId?: string } }).user?.userId;
    const row = await upsertBranding(req.body || {}, userId);
    ok(res, row.value, "Branding updated");
  } catch (error) {
    handleRouteError(error, res);
  }
};
