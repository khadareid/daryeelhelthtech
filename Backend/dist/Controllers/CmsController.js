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
exports.adminUpdateBranding = exports.adminDeleteTeamMember = exports.adminUpdateTeamMember = exports.adminCreateTeamMember = exports.adminGetTeamMember = exports.adminListTeam = exports.adminDeletePage = exports.adminUpdatePage = exports.adminCreatePage = exports.adminEnsurePages = exports.adminGetPage = exports.adminListPages = exports.publicTeam = exports.publicPage = exports.publicPages = exports.publicSettings = exports.publicBundle = void 0;
const client_1 = require("@prisma/client");
const cms_service_1 = require("../services/cms.service");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
function parseCategory(raw) {
    if (!raw)
        return undefined;
    const value = String(raw).toUpperCase();
    return Object.values(client_1.TeamMemberCategory).includes(value)
        ? value
        : undefined;
}
const publicBundle = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, cms_service_1.getPublicCmsBundle)());
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.publicBundle = publicBundle;
const publicSettings = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, cms_service_1.listPublicSettings)());
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.publicSettings = publicSettings;
const publicPages = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, cms_service_1.listPublicPages)());
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.publicPages = publicPages;
const publicPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, cms_service_1.getPublicPage)(req.params.slug));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.publicPage = publicPage;
const publicTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, cms_service_1.getPublicTeamGrouped)());
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.publicTeam = publicTeam;
const adminListPages = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, cms_service_1.listAdminPages)());
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminListPages = adminListPages;
const adminGetPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, cms_service_1.getAdminPage)(req.params.id));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminGetPage = adminGetPage;
const adminEnsurePages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        (0, response_1.ok)(res, yield (0, cms_service_1.ensureCatalogPages)(userId), "All site pages ready");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminEnsurePages = adminEnsurePages;
const adminCreatePage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const body = req.body || {};
        (0, response_1.created)(res, yield (0, cms_service_1.createPage)({
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
            status: body.status || client_1.CmsPageStatus.DRAFT,
            sortOrder: Number((_b = body.sortOrder) !== null && _b !== void 0 ? _b : 0),
        }, userId), "Page created");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminCreatePage = adminCreatePage;
const adminUpdatePage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const body = req.body || {};
        (0, response_1.ok)(res, yield (0, cms_service_1.updatePage)(req.params.id, {
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
            sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        }, userId), "Page updated");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminUpdatePage = adminUpdatePage;
const adminDeletePage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, cms_service_1.deletePage)(req.params.id), "Page deleted");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminDeletePage = adminDeletePage;
const adminListTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, cms_service_1.listAdminTeam)(parseCategory(req.query.category)));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminListTeam = adminListTeam;
const adminGetTeamMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, cms_service_1.getAdminTeamMember)(req.params.id));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminGetTeamMember = adminGetTeamMember;
const adminCreateTeamMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const body = req.body || {};
        (0, response_1.created)(res, yield (0, cms_service_1.createTeamMember)({
            fullName: body.fullName,
            title: body.title,
            slug: body.slug,
            department: body.department,
            category: parseCategory(body.category) || client_1.TeamMemberCategory.STAFF,
            bio: body.bio,
            email: body.email,
            phone: body.phone,
            photoUrl: body.photoUrl,
            expertise: Array.isArray(body.expertise)
                ? body.expertise
                : typeof body.expertise === "string"
                    ? body.expertise
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : [],
            education: body.education,
            yearsExperience: body.yearsExperience !== undefined && body.yearsExperience !== ""
                ? Number(body.yearsExperience)
                : null,
            socialLinks: body.socialLinks,
            sortOrder: Number((_a = body.sortOrder) !== null && _a !== void 0 ? _a : 0),
            isPublished: body.isPublished !== false,
            isFeatured: Boolean(body.isFeatured),
        }), "Team member created");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminCreateTeamMember = adminCreateTeamMember;
const adminUpdateTeamMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body || {};
        const expertise = Array.isArray(body.expertise)
            ? body.expertise
            : typeof body.expertise === "string"
                ? body.expertise
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : undefined;
        (0, response_1.ok)(res, yield (0, cms_service_1.updateTeamMember)(req.params.id, {
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
            yearsExperience: body.yearsExperience !== undefined && body.yearsExperience !== ""
                ? Number(body.yearsExperience)
                : body.yearsExperience === null
                    ? null
                    : undefined,
            socialLinks: body.socialLinks,
            sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
            isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : undefined,
            isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : undefined,
        }), "Team member updated");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminUpdateTeamMember = adminUpdateTeamMember;
const adminDeleteTeamMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, cms_service_1.deleteTeamMember)(req.params.id), "Team member deleted");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminDeleteTeamMember = adminDeleteTeamMember;
const adminUpdateBranding = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const row = yield (0, cms_service_1.upsertBranding)(req.body || {}, userId);
        (0, response_1.ok)(res, row.value, "Branding updated");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminUpdateBranding = adminUpdateBranding;
