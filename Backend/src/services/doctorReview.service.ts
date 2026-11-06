import { Prisma, Role } from "@prisma/client";
import { isAdminRole } from "../helpers/middleware/rbac";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/ownership";
import { pageMeta, parsePagination } from "../utils/pagination";
import {
  optionalString,
  parseBool,
  parseNumber,
  requireString,
} from "../utils/validation";

const refreshDoctorRating = async (doctorId: string) => {
  const agg = await prisma.doctorReview.aggregate({
    where: { doctorId, isPublished: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      rating: agg._avg.rating ?? null,
      reviewCount: agg._count._all,
    },
  });
};

export const listDoctorReviews = async (query: Record<string, unknown>) => {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.DoctorReviewWhereInput = { isPublished: true };
  if (query.doctorId) where.doctorId = String(query.doctorId);
  if (query.userId) where.userId = String(query.userId);

  const [items, total] = await Promise.all([
    prisma.doctorReview.findMany({
      where,
      include: {
        user: { select: { userid: true, fullName: true, picture: true } },
        doctor: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.doctorReview.count({ where }),
  ]);

  return { items, meta: pageMeta(total, page, limit) };
};

export const createDoctorReview = async (
  actor: { userId: string; role: Role },
  body: Record<string, unknown>
) => {
  const doctorId = requireString(body.doctorId, "doctorId");
  const rating = parseNumber(body.rating, "rating", true)!;
  if (rating < 1 || rating > 5) throw new HttpError(400, "rating must be 1-5");

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new HttpError(404, "Doctor not found");

  const review = await prisma.doctorReview.create({
    data: {
      userId: actor.userId,
      doctorId,
      appointmentId: optionalString(body.appointmentId) ?? null,
      rating,
      review: optionalString(body.review) ?? null,
      isAnonymous: parseBool(body.isAnonymous, false)!,
      isPublished: parseBool(body.isPublished, true)!,
    },
  });

  await refreshDoctorRating(doctorId);
  return review;
};

export const updateDoctorReview = async (
  id: string,
  actor: { userId: string; role: Role },
  body: Record<string, unknown>
) => {
  const row = await prisma.doctorReview.findUnique({ where: { id } });
  if (!row) throw new HttpError(404, "Review not found");
  if (!isAdminRole(actor.role) && row.userId !== actor.userId) {
    throw new HttpError(403, "Forbidden");
  }

  const data: Prisma.DoctorReviewUpdateInput = {};
  if (body.rating !== undefined) {
    const rating = parseNumber(body.rating, "rating", true)!;
    if (rating < 1 || rating > 5) throw new HttpError(400, "rating must be 1-5");
    data.rating = rating;
  }
  if (body.review !== undefined) data.review = optionalString(body.review) ?? null;
  if (body.isAnonymous !== undefined) data.isAnonymous = parseBool(body.isAnonymous);
  if (body.isPublished !== undefined) data.isPublished = parseBool(body.isPublished);

  const updated = await prisma.doctorReview.update({ where: { id }, data });
  if (row.doctorId) await refreshDoctorRating(row.doctorId);
  return updated;
};

export const deleteDoctorReview = async (
  id: string,
  actor: { userId: string; role: Role }
) => {
  const row = await prisma.doctorReview.findUnique({ where: { id } });
  if (!row) throw new HttpError(404, "Review not found");
  if (!isAdminRole(actor.role) && row.userId !== actor.userId) {
    throw new HttpError(403, "Forbidden");
  }
  await prisma.doctorReview.delete({ where: { id } });
  if (row.doctorId) await refreshDoctorRating(row.doctorId);
  return { deleted: true };
};
