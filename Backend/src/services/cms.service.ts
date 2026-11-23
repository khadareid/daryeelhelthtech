import {
  CmsPageStatus,
  Prisma,
  TeamMemberCategory,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/ownership";

const SITE_BRANDING_KEY = "site.branding";

export type SiteBranding = {
  name: string;
  appName: string;
  tagline: string;
  description: string;
  url: string;
  supportEmail: string;
  supportPhone: string;
  location: string;
  address?: string;
};

const DEFAULT_BRANDING: SiteBranding = {
  name: "Daryeel",
  appName: "Daryeel Health",
  tagline: "Caafimaadkaaga, Gacantaada",
  description:
    "Multi-tenant digital health platform connecting patients, providers, hospitals, labs, and pharmacies across Somaliland and East Africa.",
  url: "https://www.daryeelhealth.com",
  supportEmail: "info@daryeel.com",
  supportPhone: "+252634000100",
  location: "Hargeisa · Somaliland · East Africa",
  address: "Hargeisa, Somaliland",
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function getPublicBranding(): Promise<SiteBranding> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: SITE_BRANDING_KEY },
  });
  if (!row?.value || typeof row.value !== "object") return DEFAULT_BRANDING;
  return { ...DEFAULT_BRANDING, ...(row.value as SiteBranding) };
}

export async function upsertBranding(
  data: Partial<SiteBranding>,
  updatedBy?: string
) {
  const current = await getPublicBranding();
  const next = { ...current, ...data };
  return prisma.platformSetting.upsert({
    where: { key: SITE_BRANDING_KEY },
    create: {
      key: SITE_BRANDING_KEY,
      value: next,
      description: "Public website & app branding",
      category: "CMS",
      isPublic: true,
      updatedBy,
    },
    update: {
      value: next,
      category: "CMS",
      isPublic: true,
      updatedBy,
    },
  });
}

export async function listPublicSettings() {
  const rows = await prisma.platformSetting.findMany({
    where: { isPublic: true },
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });
  const branding = await getPublicBranding();
  return {
    branding,
    settings: Object.fromEntries(rows.map((r) => [r.key, r.value])),
  };
}

export async function getPublicPage(slug: string) {
  const page = await prisma.cmsPage.findFirst({
    where: { slug, status: CmsPageStatus.PUBLISHED },
  });
  if (!page) throw new HttpError(404, "Page not found");
  return page;
}

export async function listPublicPages() {
  return prisma.cmsPage.findMany({
    where: { status: CmsPageStatus.PUBLISHED },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      summary: true,
      heroImageUrl: true,
      body: true,
      highlights: true,
      quote: true,
      cta: true,
      sortOrder: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
}

export async function listAdminPages() {
  return prisma.cmsPage.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getAdminPage(id: string) {
  const page = await prisma.cmsPage.findUnique({ where: { id } });
  if (!page) throw new HttpError(404, "Page not found");
  return page;
}

export async function createPage(
  data: Prisma.CmsPageCreateInput,
  updatedBy?: string
) {
  const slug = data.slug || slugify(data.title);
  return prisma.cmsPage.create({
    data: {
      ...data,
      slug,
      updatedBy,
      publishedAt:
        data.status === CmsPageStatus.PUBLISHED
          ? data.publishedAt || new Date()
          : data.publishedAt ?? null,
    },
  });
}

export async function updatePage(
  id: string,
  data: Prisma.CmsPageUpdateInput,
  updatedBy?: string
) {
  const existing = await getAdminPage(id);
  const nextStatus =
    (data.status as CmsPageStatus | undefined) ?? existing.status;
  return prisma.cmsPage.update({
    where: { id },
    data: {
      ...data,
      updatedBy,
      publishedAt:
        nextStatus === CmsPageStatus.PUBLISHED
          ? existing.publishedAt || new Date()
          : existing.publishedAt,
    },
  });
}

export async function deletePage(id: string) {
  await getAdminPage(id);
  await prisma.cmsPage.delete({ where: { id } });
  return { deleted: true, id };
}

export async function listPublicTeam(category?: TeamMemberCategory) {
  return prisma.teamMember.findMany({
    where: {
      isPublished: true,
      ...(category ? { category } : {}),
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { fullName: "asc" }],
  });
}

export async function getPublicTeamGrouped() {
  const members = await listPublicTeam();
  const groups: Record<string, typeof members> = {};
  for (const m of members) {
    if (!groups[m.category]) groups[m.category] = [];
    groups[m.category].push(m);
  }
  return {
    members,
    groups,
    counts: {
      board: groups.BOARD?.length ?? 0,
      executive: groups.EXECUTIVE?.length ?? 0,
      department: groups.DEPARTMENT?.length ?? 0,
      staff: groups.STAFF?.length ?? 0,
      partner: groups.PARTNER?.length ?? 0,
      sponsor: groups.SPONSOR?.length ?? 0,
      volunteer: groups.VOLUNTEER?.length ?? 0,
      total: members.length,
    },
  };
}

export async function listAdminTeam(category?: TeamMemberCategory) {
  return prisma.teamMember.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { fullName: "asc" }],
  });
}

export async function getAdminTeamMember(id: string) {
  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member) throw new HttpError(404, "Team member not found");
  return member;
}

export async function createTeamMember(data: {
  fullName: string;
  title: string;
  slug?: string;
  department?: string | null;
  category?: TeamMemberCategory;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  expertise?: string[];
  education?: string | null;
  yearsExperience?: number | null;
  socialLinks?: Prisma.InputJsonValue;
  sortOrder?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
}) {
  const slug = data.slug || slugify(data.fullName);
  return prisma.teamMember.create({
    data: {
      fullName: data.fullName,
      title: data.title,
      slug,
      department: data.department ?? null,
      category: data.category ?? TeamMemberCategory.STAFF,
      bio: data.bio ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      photoUrl: data.photoUrl ?? null,
      expertise: data.expertise ?? [],
      education: data.education ?? null,
      yearsExperience: data.yearsExperience ?? null,
      socialLinks: data.socialLinks ?? undefined,
      sortOrder: data.sortOrder ?? 0,
      isPublished: data.isPublished ?? true,
      isFeatured: data.isFeatured ?? false,
    },
  });
}

export async function updateTeamMember(
  id: string,
  data: Prisma.TeamMemberUpdateInput
) {
  await getAdminTeamMember(id);
  return prisma.teamMember.update({ where: { id }, data });
}

export async function deleteTeamMember(id: string) {
  await getAdminTeamMember(id);
  await prisma.teamMember.delete({ where: { id } });
  return { deleted: true, id };
}

import { CMS_PAGE_CATALOG } from "../config/cmsPageCatalog";
import { bodyForSlug } from "../config/cmsListDefaults";

/** Create/update every catalog page so admin can edit all site copy */
export async function ensureCatalogPages(updatedBy?: string) {
  const results = [];
  for (const page of CMS_PAGE_CATALOG) {
    const defaultBody =
      "body" in page && page.body
        ? (page.body as Prisma.InputJsonValue)
        : bodyForSlug(page.slug);

    const row = await prisma.cmsPage.upsert({
      where: { slug: page.slug },
      create: {
        slug: page.slug,
        title: page.title,
        subtitle: page.subtitle,
        summary: page.summary,
        highlights: "highlights" in page ? page.highlights : undefined,
        cta: "cta" in page ? page.cta : undefined,
        body: defaultBody,
        status: CmsPageStatus.PUBLISHED,
        publishedAt: new Date(),
        sortOrder: page.sortOrder,
        updatedBy,
      },
      update: {
        status: CmsPageStatus.PUBLISHED,
        publishedAt: new Date(),
        sortOrder: page.sortOrder,
        updatedBy,
      },
    });

    const patch: Prisma.CmsPageUpdateInput = {};
    if (!row.subtitle && !row.summary) {
      patch.title = page.title;
      patch.subtitle = page.subtitle;
      patch.summary = page.summary;
      if ("highlights" in page) patch.highlights = page.highlights;
      if ("cta" in page) patch.cta = page.cta;
    }
    // Seed body when empty — list pages need items; about needs mission/vision
    if (defaultBody) {
      const existing =
        row.body && typeof row.body === "object" && !Array.isArray(row.body)
          ? (row.body as Record<string, unknown>)
          : null;
      const isListSlug = ["training", "events", "insights"].includes(page.slug);
      const needsList =
        isListSlug &&
        (!existing ||
          !Array.isArray(existing.items) ||
          !(existing.items as unknown[]).length);
      const needsAbout =
        page.slug === "about" &&
        (!existing || (!existing.mission && !existing.vision));
      if (needsList || needsAbout || !existing) {
        patch.body = defaultBody;
      }
    }
    if (Object.keys(patch).length) {
      await prisma.cmsPage.update({ where: { id: row.id }, data: patch });
    }
    results.push(row);
  }

  return listAdminPages();
}

/** Full public payload for web + mobile apps */
export async function getPublicCmsBundle() {
  const [branding, pages, team] = await Promise.all([
    getPublicBranding(),
    listPublicPages(),
    getPublicTeamGrouped(),
  ]);
  const leadershipPage = await prisma.cmsPage.findFirst({
    where: {
      slug: { in: ["management-staff", "leadership", "team"] },
      status: CmsPageStatus.PUBLISHED,
    },
  });
  return {
    branding,
    pages,
    leadershipPage,
    team,
  };
}
