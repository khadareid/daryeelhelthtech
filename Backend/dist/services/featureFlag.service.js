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
exports.DEFAULT_FEATURE_FLAGS = void 0;
exports.ensureDefaultFeatureFlags = ensureDefaultFeatureFlags;
exports.isFeatureAllowed = isFeatureAllowed;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
exports.DEFAULT_FEATURE_FLAGS = [
    {
        key: "patient_dashboard",
        label: "Patient dashboard",
        description: "Patient care home",
        enabled: true,
        allowedRoles: ["USER", "PATIENT", "SUPER_ADMIN", "ADMIN"],
        actions: ["read"],
    },
    {
        key: "doctor_dashboard",
        label: "Doctor dashboard",
        description: "Clinical workspace",
        enabled: true,
        allowedRoles: ["DOCTOR", "NURSE", "MIDWIFE", "SUPER_ADMIN", "ADMIN"],
        actions: ["read", "manage"],
    },
    {
        key: "appointments",
        label: "Appointments",
        description: "Book and manage visits",
        enabled: true,
        allowedRoles: [],
        actions: ["read", "create", "update", "delete"],
    },
    {
        key: "medical_records",
        label: "Medical records",
        description: "Clinical records access",
        enabled: true,
        allowedRoles: ["PATIENT", "DOCTOR", "NURSE", "MIDWIFE", "SUPER_ADMIN", "ADMIN"],
        actions: ["read", "create", "update"],
    },
    {
        key: "prescriptions",
        label: "Prescriptions",
        description: "Medication orders",
        enabled: true,
        allowedRoles: ["PATIENT", "DOCTOR", "PHARMACIST", "SUPER_ADMIN", "ADMIN"],
        actions: ["read", "create"],
    },
    {
        key: "laboratory",
        label: "Laboratory",
        description: "Lab orders and results",
        enabled: true,
        allowedRoles: ["PATIENT", "DOCTOR", "LAB_TECH", "SUPER_ADMIN", "ADMIN"],
        actions: ["read", "create"],
    },
    {
        key: "pharmacy",
        label: "Pharmacy",
        description: "Pharmacy module",
        enabled: true,
        allowedRoles: [],
        actions: ["read"],
    },
    {
        key: "wallet",
        label: "Wallet and payments",
        description: "Wallet module",
        enabled: true,
        allowedRoles: [],
        actions: ["read", "create"],
    },
    {
        key: "notifications",
        label: "Notifications",
        description: "In-app alerts",
        enabled: true,
        allowedRoles: [],
        actions: ["read"],
    },
    {
        key: "news_feed",
        label: "News Feed",
        description: "Publish and read health news",
        enabled: true,
        allowedRoles: [],
        actions: ["read", "create", "update", "delete"],
    },
    {
        key: "news_comments",
        label: "News comments",
        description: "Comment on posts",
        enabled: true,
        allowedRoles: [],
        actions: ["read", "create", "update", "delete"],
    },
    {
        key: "news_reactions",
        label: "News reactions",
        description: "Like / react to posts",
        enabled: true,
        allowedRoles: [],
        actions: ["create", "delete"],
    },
    {
        key: "messaging",
        label: "Messaging",
        description: "Doctor-patient chat",
        enabled: true,
        allowedRoles: [],
        actions: ["read", "create"],
    },
    {
        key: "professional_applications",
        label: "Professional applications",
        description: "Apply as clinician",
        enabled: true,
        allowedRoles: ["USER", "PATIENT", "SUPER_ADMIN", "ADMIN"],
        actions: ["read", "create", "approve", "manage"],
    },
    {
        key: "admin_settings",
        label: "Administrative settings",
        description: "Super Admin controls",
        enabled: true,
        allowedRoles: ["SUPER_ADMIN", "ADMIN"],
        actions: ["read", "manage", "approve"],
    },
];
function ensureDefaultFeatureFlags() {
    return __awaiter(this, void 0, void 0, function* () {
        const count = yield prisma_1.prisma.featureFlag.count();
        if (count > 0)
            return;
        yield prisma_1.prisma.featureFlag.createMany({
            data: exports.DEFAULT_FEATURE_FLAGS.map((item) => ({
                key: item.key,
                label: item.label,
                description: item.description,
                enabled: item.enabled,
                allowedRoles: item.allowedRoles,
                actions: item.actions,
                client: client_1.FeatureClient.ALL,
            })),
        });
    });
}
function isFeatureAllowed(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield ensureDefaultFeatureFlags();
        const flag = yield prisma_1.prisma.featureFlag.findUnique({
            where: { key: input.key },
            include: {
                overrides: input.userId
                    ? { where: { userId: input.userId }, take: 1 }
                    : false,
            },
        });
        if (!flag)
            return true;
        if (input.client && flag.client !== client_1.FeatureClient.ALL) {
            if (flag.client !== input.client)
                return false;
        }
        const override = Array.isArray(flag.overrides) ? flag.overrides[0] : undefined;
        const enabled = override ? override.enabled : flag.enabled;
        if (!enabled)
            return false;
        const action = input.action || "read";
        const actions = ((_a = override === null || override === void 0 ? void 0 : override.actions) === null || _a === void 0 ? void 0 : _a.length) ? override.actions : flag.actions;
        if (actions.length > 0 && !actions.includes(action) && !actions.includes("manage")) {
            return false;
        }
        if (flag.allowedRoles.length === 0)
            return true;
        if (!input.role)
            return false;
        return flag.allowedRoles.includes(String(input.role));
    });
}
