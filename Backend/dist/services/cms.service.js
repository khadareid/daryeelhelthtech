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
exports.getPublicBranding = getPublicBranding;
exports.upsertBranding = upsertBranding;
exports.listPublicSettings = listPublicSettings;
exports.getPublicPage = getPublicPage;
exports.listPublicPages = listPublicPages;
exports.listAdminPages = listAdminPages;
exports.getAdminPage = getAdminPage;
exports.createPage = createPage;
exports.updatePage = updatePage;
exports.deletePage = deletePage;
exports.listPublicTeam = listPublicTeam;
exports.getPublicTeamGrouped = getPublicTeamGrouped;
exports.listAdminTeam = listAdminTeam;
exports.getAdminTeamMember = getAdminTeamMember;
exports.createTeamMember = createTeamMember;
exports.updateTeamMember = updateTeamMember;
exports.deleteTeamMember = deleteTeamMember;
exports.ensureCatalogPages = ensureCatalogPages;
exports.getPublicCmsBundle = getPublicCmsBundle;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const ownership_1 = require("../utils/ownership");
const SITE_BRANDING_KEY = "site.branding";
const DEFAULT_BRANDING = {
    name: "Daryeel",
    appName: "Daryeel Health",
    tagline: "Caafimaadkaaga, Gacantaada",
    description: "Multi-tenant digital health platform connecting patients, providers, hospitals, labs, and pharmacies across Somaliland and East Africa.",
    url: "https://www.daryeelhealth.com",
    supportEmail: "info@daryeel.com",
    supportPhone: "+252634000100",
    location: "Hargeisa · Somaliland · East Africa",
    address: "Hargeisa, Somaliland",
};
function slugify(input) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}
function getPublicBranding() {
    return __awaiter(this, void 0, void 0, function* () {
        const row = yield prisma_1.prisma.platformSetting.findUnique({
            where: { key: SITE_BRANDING_KEY },
        });
        if (!(row === null || row === void 0 ? void 0 : row.value) || typeof row.value !== "object")
            return DEFAULT_BRANDING;
        return Object.assign(Object.assign({}, DEFAULT_BRANDING), row.value);
    });
}
function upsertBranding(data, updatedBy) {
    return __awaiter(this, void 0, void 0, function* () {
        const current = yield getPublicBranding();
        const next = Object.assign(Object.assign({}, current), data);
        return prisma_1.prisma.platformSetting.upsert({
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
    });
}
function listPublicSettings() {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = yield prisma_1.prisma.platformSetting.findMany({
            where: { isPublic: true },
            orderBy: [{ category: "asc" }, { key: "asc" }],
        });
        const branding = yield getPublicBranding();
        return {
            branding,
            settings: Object.fromEntries(rows.map((r) => [r.key, r.value])),
        };
    });
}
function getPublicPage(slug) {
    return __awaiter(this, void 0, void 0, function* () {
        const page = yield prisma_1.prisma.cmsPage.findFirst({
            where: { slug, status: client_1.CmsPageStatus.PUBLISHED },
        });
        if (!page)
            throw new ownership_1.HttpError(404, "Page not found");
        return page;
    });
}
function listPublicPages() {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.prisma.cmsPage.findMany({
            where: { status: client_1.CmsPageStatus.PUBLISHED },
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
    });
}
function listAdminPages() {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.prisma.cmsPage.findMany({
            orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
        });
    });
}
function getAdminPage(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const page = yield prisma_1.prisma.cmsPage.findUnique({ where: { id } });
        if (!page)
            throw new ownership_1.HttpError(404, "Page not found");
        return page;
    });
}
function createPage(data, updatedBy) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const slug = data.slug || slugify(data.title);
        return prisma_1.prisma.cmsPage.create({
            data: Object.assign(Object.assign({}, data), { slug,
                updatedBy, publishedAt: data.status === client_1.CmsPageStatus.PUBLISHED
                    ? data.publishedAt || new Date()
                    : (_a = data.publishedAt) !== null && _a !== void 0 ? _a : null }),
        });
    });
}
function updatePage(id, data, updatedBy) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const existing = yield getAdminPage(id);
        const nextStatus = (_a = data.status) !== null && _a !== void 0 ? _a : existing.status;
        return prisma_1.prisma.cmsPage.update({
            where: { id },
            data: Object.assign(Object.assign({}, data), { updatedBy, publishedAt: nextStatus === client_1.CmsPageStatus.PUBLISHED
                    ? existing.publishedAt || new Date()
                    : existing.publishedAt }),
        });
    });
}
function deletePage(id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield getAdminPage(id);
        yield prisma_1.prisma.cmsPage.delete({ where: { id } });
        return { deleted: true, id };
    });
}
function listPublicTeam(category) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.prisma.teamMember.findMany({
            where: Object.assign({ isPublished: true }, (category ? { category } : {})),
            orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { fullName: "asc" }],
        });
    });
}
function getPublicTeamGrouped() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        const members = yield listPublicTeam();
        const groups = {};
        for (const m of members) {
            if (!groups[m.category])
                groups[m.category] = [];
            groups[m.category].push(m);
        }
        return {
            members,
            groups,
            counts: {
                board: (_b = (_a = groups.BOARD) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0,
                executive: (_d = (_c = groups.EXECUTIVE) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0,
                department: (_f = (_e = groups.DEPARTMENT) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0,
                staff: (_h = (_g = groups.STAFF) === null || _g === void 0 ? void 0 : _g.length) !== null && _h !== void 0 ? _h : 0,
                partner: (_k = (_j = groups.PARTNER) === null || _j === void 0 ? void 0 : _j.length) !== null && _k !== void 0 ? _k : 0,
                sponsor: (_m = (_l = groups.SPONSOR) === null || _l === void 0 ? void 0 : _l.length) !== null && _m !== void 0 ? _m : 0,
                volunteer: (_p = (_o = groups.VOLUNTEER) === null || _o === void 0 ? void 0 : _o.length) !== null && _p !== void 0 ? _p : 0,
                total: members.length,
            },
        };
    });
}
function listAdminTeam(category) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.prisma.teamMember.findMany({
            where: category ? { category } : undefined,
            orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { fullName: "asc" }],
        });
    });
}
function getAdminTeamMember(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const member = yield prisma_1.prisma.teamMember.findUnique({ where: { id } });
        if (!member)
            throw new ownership_1.HttpError(404, "Team member not found");
        return member;
    });
}
function createTeamMember(data) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        const slug = data.slug || slugify(data.fullName);
        return prisma_1.prisma.teamMember.create({
            data: {
                fullName: data.fullName,
                title: data.title,
                slug,
                department: (_a = data.department) !== null && _a !== void 0 ? _a : null,
                category: (_b = data.category) !== null && _b !== void 0 ? _b : client_1.TeamMemberCategory.STAFF,
                bio: (_c = data.bio) !== null && _c !== void 0 ? _c : null,
                email: (_d = data.email) !== null && _d !== void 0 ? _d : null,
                phone: (_e = data.phone) !== null && _e !== void 0 ? _e : null,
                photoUrl: (_f = data.photoUrl) !== null && _f !== void 0 ? _f : null,
                expertise: (_g = data.expertise) !== null && _g !== void 0 ? _g : [],
                education: (_h = data.education) !== null && _h !== void 0 ? _h : null,
                yearsExperience: (_j = data.yearsExperience) !== null && _j !== void 0 ? _j : null,
                socialLinks: (_k = data.socialLinks) !== null && _k !== void 0 ? _k : undefined,
                sortOrder: (_l = data.sortOrder) !== null && _l !== void 0 ? _l : 0,
                isPublished: (_m = data.isPublished) !== null && _m !== void 0 ? _m : true,
                isFeatured: (_o = data.isFeatured) !== null && _o !== void 0 ? _o : false,
            },
        });
    });
}
function updateTeamMember(id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield getAdminTeamMember(id);
        return prisma_1.prisma.teamMember.update({ where: { id }, data });
    });
}
function deleteTeamMember(id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield getAdminTeamMember(id);
        yield prisma_1.prisma.teamMember.delete({ where: { id } });
        return { deleted: true, id };
    });
}
const cmsPageCatalog_1 = require("../config/cmsPageCatalog");
const cmsListDefaults_1 = require("../config/cmsListDefaults");
/** Create/update every catalog page so admin can edit all site copy */
function ensureCatalogPages(updatedBy) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = [];
        for (const page of cmsPageCatalog_1.CMS_PAGE_CATALOG) {
            const defaultBody = "body" in page && page.body
                ? page.body
                : (0, cmsListDefaults_1.bodyForSlug)(page.slug);
            const row = yield prisma_1.prisma.cmsPage.upsert({
                where: { slug: page.slug },
                create: {
                    slug: page.slug,
                    title: page.title,
                    subtitle: page.subtitle,
                    summary: page.summary,
                    highlights: "highlights" in page ? page.highlights : undefined,
                    cta: "cta" in page ? page.cta : undefined,
                    body: defaultBody,
                    status: client_1.CmsPageStatus.PUBLISHED,
                    publishedAt: new Date(),
                    sortOrder: page.sortOrder,
                    updatedBy,
                },
                update: {
                    status: client_1.CmsPageStatus.PUBLISHED,
                    publishedAt: new Date(),
                    sortOrder: page.sortOrder,
                    updatedBy,
                },
            });
            const patch = {};
            if (!row.subtitle && !row.summary) {
                patch.title = page.title;
                patch.subtitle = page.subtitle;
                patch.summary = page.summary;
                if ("highlights" in page)
                    patch.highlights = page.highlights;
                if ("cta" in page)
                    patch.cta = page.cta;
            }
            // Seed body when empty — list pages need items; about needs mission/vision
            if (defaultBody) {
                const existing = row.body && typeof row.body === "object" && !Array.isArray(row.body)
                    ? row.body
                    : null;
                const isListSlug = ["training", "events", "insights"].includes(page.slug);
                const needsList = isListSlug &&
                    (!existing ||
                        !Array.isArray(existing.items) ||
                        !existing.items.length);
                const needsAbout = page.slug === "about" &&
                    (!existing || (!existing.mission && !existing.vision));
                if (needsList || needsAbout || !existing) {
                    patch.body = defaultBody;
                }
            }
            if (Object.keys(patch).length) {
                yield prisma_1.prisma.cmsPage.update({ where: { id: row.id }, data: patch });
            }
            results.push(row);
        }
        return listAdminPages();
    });
}
/** Full public payload for web + mobile apps */
function getPublicCmsBundle() {
    return __awaiter(this, void 0, void 0, function* () {
        const [branding, pages, team] = yield Promise.all([
            getPublicBranding(),
            listPublicPages(),
            getPublicTeamGrouped(),
        ]);
        const leadershipPage = yield prisma_1.prisma.cmsPage.findFirst({
            where: {
                slug: { in: ["management-staff", "leadership", "team"] },
                status: client_1.CmsPageStatus.PUBLISHED,
            },
        });
        return {
            branding,
            pages,
            leadershipPage,
            team,
        };
    });
}
