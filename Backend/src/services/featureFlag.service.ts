import { FeatureClient, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const DEFAULT_FEATURE_FLAGS: Array<{
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  allowedRoles: string[];
  actions: string[];
}> = [
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

export async function ensureDefaultFeatureFlags() {
  const count = await prisma.featureFlag.count();
  if (count > 0) return;
  await prisma.featureFlag.createMany({
    data: DEFAULT_FEATURE_FLAGS.map((item) => ({
      key: item.key,
      label: item.label,
      description: item.description,
      enabled: item.enabled,
      allowedRoles: item.allowedRoles,
      actions: item.actions,
      client: FeatureClient.ALL,
    })),
  });
}

export async function isFeatureAllowed(input: {
  key: string;
  userId?: string | null;
  role?: Role | string | null;
  action?: string;
  client?: "WEB" | "MOBILE" | "ALL";
}): Promise<boolean> {
  await ensureDefaultFeatureFlags();

  const flag = await prisma.featureFlag.findUnique({
    where: { key: input.key },
    include: {
      overrides: input.userId
        ? { where: { userId: input.userId }, take: 1 }
        : false,
    },
  });

  if (!flag) return true;

  if (input.client && flag.client !== FeatureClient.ALL) {
    if (flag.client !== input.client) return false;
  }

  const override = Array.isArray(flag.overrides) ? flag.overrides[0] : undefined;
  const enabled = override ? override.enabled : flag.enabled;
  if (!enabled) return false;

  const action = input.action || "read";
  const actions = override?.actions?.length ? override.actions : flag.actions;
  if (actions.length > 0 && !actions.includes(action) && !actions.includes("manage")) {
    return false;
  }

  if (flag.allowedRoles.length === 0) return true;
  if (!input.role) return false;
  return flag.allowedRoles.includes(String(input.role));
}
