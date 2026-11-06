import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/ownership";
import { pageMeta, parsePagination } from "../utils/pagination";

type Delegate = {
  findMany: (args: any) => Promise<any[]>;
  findFirst: (args: any) => Promise<any | null>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  count: (args: any) => Promise<number>;
};

export const listOwned = async (
  delegate: Delegate,
  userId: string | undefined,
  query: Record<string, unknown>,
  extraWhere: Record<string, unknown> = {}
) => {
  const { page, limit, skip, take } = parsePagination(query);
  const where = {
    ...(userId ? { userId } : {}),
    ...extraWhere,
  };
  const [items, total] = await Promise.all([
    delegate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    delegate.count({ where }),
  ]);
  return { items, meta: pageMeta(total, page, limit) };
};

export const getOwned = async (
  delegate: Delegate,
  id: string,
  actor: { userId: string; isAdmin: boolean }
) => {
  const row = await delegate.findFirst({ where: { id } });
  if (!row) throw new HttpError(404, "Not found");
  if (!actor.isAdmin && row.userId !== actor.userId) {
    throw new HttpError(403, "Forbidden");
  }
  return row;
};

export const createOwned = async (
  delegate: Delegate,
  userId: string,
  data: Record<string, unknown>
) => {
  return delegate.create({
    data: { ...data, userId },
  });
};

export const updateOwned = async (
  delegate: Delegate,
  id: string,
  actor: { userId: string; isAdmin: boolean },
  data: Record<string, unknown>
) => {
  await getOwned(delegate, id, actor);
  return delegate.update({ where: { id }, data });
};

export const deleteOwned = async (
  delegate: Delegate,
  id: string,
  actor: { userId: string; isAdmin: boolean }
) => {
  await getOwned(delegate, id, actor);
  return delegate.delete({ where: { id } });
};

export const ownedDelegates = {
  emergencyContact: prisma.emergencyContact,
  familyMember: prisma.familyMember,
  allergy: prisma.allergy,
  chronicCondition: prisma.chronicCondition,
  medication: prisma.medication,
  medicalRecord: prisma.medicalRecord,
  medicalDocument: prisma.medicalDocument,
  diagnosis: prisma.diagnosis,
  vitalSign: prisma.vitalSign,
  labResult: prisma.labResult,
  dailyHealthLog: prisma.dailyHealthLog,
  healthDeviceConnection: prisma.healthDeviceConnection,
  notification: prisma.notification,
  consent: prisma.consent,
  payment: prisma.payment,
  doctorReview: prisma.doctorReview,
};
