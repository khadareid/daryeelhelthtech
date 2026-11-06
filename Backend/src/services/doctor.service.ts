import {
  DoctorVerificationStatus,
  Gender,
  Prisma,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/ownership";
import { pageMeta, parsePagination } from "../utils/pagination";
import {
  optionalString,
  parseBool,
  parseEnum,
  parseNumber,
  requireString,
} from "../utils/validation";

export const listDoctors = async (query: Record<string, unknown>) => {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.DoctorWhereInput = {
    isActive: true,
    verificationStatus: DoctorVerificationStatus.VERIFIED,
  };

  if (query.specialty) {
    where.specialty = {
      contains: String(query.specialty),
      mode: "insensitive",
    };
  }
  if (query.city) {
    where.city = { contains: String(query.city), mode: "insensitive" };
  }
  if (query.q) {
    const q = String(query.q);
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { specialty: { contains: q, mode: "insensitive" } },
      { clinicName: { contains: q, mode: "insensitive" } },
    ];
  }
  if (query.includeUnverified === "true") {
    delete where.verificationStatus;
  }

  const [items, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: {
            userid: true,
            email: true,
            picture: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    prisma.doctor.count({ where }),
  ]);

  return { items, meta: pageMeta(total, page, limit) };
};

export const getDoctorById = async (id: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          userid: true,
          email: true,
          picture: true,
          avatarUrl: true,
        },
      },
      doctorReviews: {
        where: { isPublished: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!doctor) throw new HttpError(404, "Doctor not found");
  return doctor;
};

export const getMyDoctorProfile = async (userId: string) => {
  return prisma.doctor.findUnique({ where: { userId } });
};

export const upsertMyDoctorProfile = async (
  userId: string,
  body: Record<string, unknown>
) => {
  const existing = await prisma.doctor.findUnique({ where: { userId } });
  const fullName = body.fullName
    ? requireString(body.fullName, "fullName")
    : existing?.fullName;
  const specialty = body.specialty
    ? requireString(body.specialty, "specialty")
    : existing?.specialty;

  if (!fullName || !specialty) {
    throw new HttpError(400, "fullName and specialty are required");
  }

  const data: Prisma.DoctorUncheckedCreateInput = {
    userId,
    fullName,
    specialty,
    profileImage: optionalString(body.profileImage) ?? existing?.profileImage ?? null,
    gender:
      parseEnum(body.gender, Object.values(Gender), "gender") ??
      existing?.gender ??
      null,
    subSpecialty:
      optionalString(body.subSpecialty) ?? existing?.subSpecialty ?? null,
    qualification:
      optionalString(body.qualification) ?? existing?.qualification ?? null,
    university: optionalString(body.university) ?? existing?.university ?? null,
    yearsExperience:
      parseNumber(body.yearsExperience, "yearsExperience") ??
      existing?.yearsExperience ??
      null,
    bio: optionalString(body.bio) ?? existing?.bio ?? null,
    languages: Array.isArray(body.languages)
      ? body.languages.map(String)
      : existing?.languages ?? [],
    licenseNumber:
      optionalString(body.licenseNumber) ?? existing?.licenseNumber ?? null,
    licenseAuthority:
      optionalString(body.licenseAuthority) ??
      existing?.licenseAuthority ??
      null,
    consultationEnabled:
      parseBool(body.consultationEnabled, existing?.consultationEnabled ?? true)!,
    videoConsultationEnabled: parseBool(
      body.videoConsultationEnabled,
      existing?.videoConsultationEnabled ?? false
    )!,
    chatConsultationEnabled: parseBool(
      body.chatConsultationEnabled,
      existing?.chatConsultationEnabled ?? false
    )!,
    consultationFee:
      parseNumber(body.consultationFee, "consultationFee") ??
      (existing?.consultationFee ? Number(existing.consultationFee) : null),
    videoConsultationFee:
      parseNumber(body.videoConsultationFee, "videoConsultationFee") ??
      (existing?.videoConsultationFee
        ? Number(existing.videoConsultationFee)
        : null),
    chatConsultationFee:
      parseNumber(body.chatConsultationFee, "chatConsultationFee") ??
      (existing?.chatConsultationFee
        ? Number(existing.chatConsultationFee)
        : null),
    currency: optionalString(body.currency) || existing?.currency || "USD",
    isAvailable: parseBool(body.isAvailable, existing?.isAvailable ?? true)!,
    isOnline: parseBool(body.isOnline, existing?.isOnline ?? false)!,
    clinicName: optionalString(body.clinicName) ?? existing?.clinicName ?? null,
    city: optionalString(body.city) ?? existing?.city ?? null,
    country: optionalString(body.country) ?? existing?.country ?? null,
  };

  if (existing) {
    const { userId: _u, ...update } = data;
    // Allow rejected applicants to re-submit for review
    if (
      existing.verificationStatus === DoctorVerificationStatus.REJECTED &&
      body.resubmit === true
    ) {
      (update as Prisma.DoctorUpdateInput).verificationStatus =
        DoctorVerificationStatus.PENDING;
      (update as Prisma.DoctorUpdateInput).rejectionReason = null;
      (update as Prisma.DoctorUpdateInput).verifiedAt = null;
    }
    return prisma.doctor.update({ where: { userId }, data: update });
  }

  return prisma.doctor.create({
    data: {
      ...data,
      verificationStatus: DoctorVerificationStatus.PENDING,
      isActive: true,
      isAvailable: false,
    },
  });
};

export const adminVerifyDoctor = async (
  id: string,
  body: Record<string, unknown>
) => {
  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) throw new HttpError(404, "Doctor not found");

  const status = parseEnum(
    body.status ?? body.verificationStatus,
    Object.values(DoctorVerificationStatus),
    "status",
    true
  )!;

  return prisma.doctor.update({
    where: { id },
    data: {
      verificationStatus: status,
      verifiedAt: status === DoctorVerificationStatus.VERIFIED ? new Date() : null,
      rejectionReason:
        status === DoctorVerificationStatus.REJECTED
          ? optionalString(body.rejectionReason) ?? null
          : null,
      isActive:
        status === DoctorVerificationStatus.SUSPENDED
          ? false
          : parseBool(body.isActive, doctor.isActive)!,
    },
  });
};

export const listPendingDoctors = async (query: Record<string, unknown>) => {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.DoctorWhereInput = {
    verificationStatus: DoctorVerificationStatus.PENDING,
  };
  const [items, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      include: {
        user: { select: { userid: true, email: true, fullName: true } },
      },
      orderBy: { createdAt: "asc" },
      skip,
      take,
    }),
    prisma.doctor.count({ where }),
  ]);
  return { items, meta: pageMeta(total, page, limit) };
};

export const adminListDoctors = async (query: Record<string, unknown>) => {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.DoctorWhereInput = {};
  if (query.status) {
    where.verificationStatus = parseEnum(
      query.status,
      Object.values(DoctorVerificationStatus),
      "status",
      true
    )!;
  }
  if (query.q) {
    const q = String(query.q);
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { specialty: { contains: q, mode: "insensitive" } },
      { clinicName: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: {
            userid: true,
            email: true,
            fullName: true,
            phone: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.doctor.count({ where }),
  ]);
  return { items, meta: pageMeta(total, page, limit) };
};

/** Admin updates doctor profile, fees, availability, and verification flags. */
export const adminUpdateDoctor = async (
  id: string,
  body: Record<string, unknown>
) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: { user: { select: { userid: true, phone: true } } },
  });
  if (!doctor) throw new HttpError(404, "Doctor not found");

  const data: Prisma.DoctorUpdateInput = {};

  if (body.fullName !== undefined) {
    data.fullName = requireString(body.fullName, "fullName");
  }
  if (body.specialty !== undefined) {
    data.specialty = requireString(body.specialty, "specialty");
  }
  if (body.subSpecialty !== undefined) {
    data.subSpecialty = optionalString(body.subSpecialty);
  }
  if (body.qualification !== undefined) {
    data.qualification = optionalString(body.qualification);
  }
  if (body.university !== undefined) {
    data.university = optionalString(body.university);
  }
  if (body.yearsExperience !== undefined) {
    data.yearsExperience = parseNumber(body.yearsExperience, "yearsExperience");
  }
  if (body.bio !== undefined) data.bio = optionalString(body.bio);
  if (body.licenseNumber !== undefined) {
    data.licenseNumber = optionalString(body.licenseNumber);
  }
  if (body.licenseAuthority !== undefined) {
    data.licenseAuthority = optionalString(body.licenseAuthority);
  }
  if (body.clinicName !== undefined) {
    data.clinicName = optionalString(body.clinicName);
  }
  if (body.city !== undefined) data.city = optionalString(body.city);
  if (body.country !== undefined) data.country = optionalString(body.country);
  if (body.currency !== undefined) {
    data.currency = optionalString(body.currency) || "USD";
  }
  if (body.consultationFee !== undefined) {
    data.consultationFee = parseNumber(body.consultationFee, "consultationFee");
  }
  if (body.videoConsultationFee !== undefined) {
    data.videoConsultationFee = parseNumber(
      body.videoConsultationFee,
      "videoConsultationFee"
    );
  }
  if (body.chatConsultationFee !== undefined) {
    data.chatConsultationFee = parseNumber(
      body.chatConsultationFee,
      "chatConsultationFee"
    );
  }
  if (body.consultationEnabled !== undefined) {
    data.consultationEnabled = parseBool(body.consultationEnabled, true)!;
  }
  if (body.videoConsultationEnabled !== undefined) {
    data.videoConsultationEnabled = parseBool(
      body.videoConsultationEnabled,
      false
    )!;
  }
  if (body.chatConsultationEnabled !== undefined) {
    data.chatConsultationEnabled = parseBool(
      body.chatConsultationEnabled,
      false
    )!;
  }
  if (body.isAvailable !== undefined) {
    data.isAvailable = parseBool(body.isAvailable, true)!;
  }
  if (body.isOnline !== undefined) {
    data.isOnline = parseBool(body.isOnline, false)!;
  }
  if (body.isActive !== undefined) {
    data.isActive = parseBool(body.isActive, true)!;
  }
  if (body.verificationStatus !== undefined || body.status !== undefined) {
    const status = parseEnum(
      body.verificationStatus ?? body.status,
      Object.values(DoctorVerificationStatus),
      "verificationStatus",
      true
    )!;
    data.verificationStatus = status;
    data.verifiedAt =
      status === DoctorVerificationStatus.VERIFIED ? new Date() : null;
    if (status === DoctorVerificationStatus.REJECTED) {
      data.rejectionReason = optionalString(body.rejectionReason) ?? null;
    }
    if (status === DoctorVerificationStatus.SUSPENDED) {
      data.isActive = false;
    }
  }
  if (body.rejectionReason !== undefined) {
    data.rejectionReason = optionalString(body.rejectionReason);
  }

  const phone = optionalString(body.phone);
  const updated = await prisma.$transaction(async (tx) => {
    if (phone !== undefined) {
      await tx.user.update({
        where: { userid: doctor.userId },
        data: { phone },
      });
    }
    return tx.doctor.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            userid: true,
            email: true,
            fullName: true,
            phone: true,
            isActive: true,
          },
        },
      },
    });
  });

  return updated;
};

/** Soft-deactivate a doctor (keeps history; hides from directory). */
export const adminDeleteDoctor = async (id: string) => {
  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) throw new HttpError(404, "Doctor not found");

  return prisma.doctor.update({
    where: { id },
    data: {
      isActive: false,
      isAvailable: false,
      verificationStatus: DoctorVerificationStatus.SUSPENDED,
    },
    include: {
      user: {
        select: {
          userid: true,
          email: true,
          fullName: true,
          phone: true,
        },
      },
    },
  });
};

/** Admin creates a login + verified doctor profile in one step. */
export const adminCreateDoctor = async (body: Record<string, unknown>) => {
  const bcrypt = await import("bcryptjs");
  const { generateUniqueHealthId } = await import("../utils/codes");

  const email = requireString(body.email, "email").toLowerCase();
  const password = requireString(body.password, "password", { min: 6 });
  const fullName = requireString(body.fullName ?? body.name, "fullName");
  const specialty = requireString(body.specialty, "specialty");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && !existing.deletedAt) {
    const hasDoctor = await prisma.doctor.findUnique({
      where: { userId: existing.userid },
    });
    if (hasDoctor) throw new HttpError(409, "This user is already a doctor");

    const doctor = await prisma.doctor.create({
      data: {
        userId: existing.userid,
        fullName,
        specialty,
        subSpecialty: optionalString(body.subSpecialty) ?? null,
        licenseNumber: optionalString(body.licenseNumber) ?? null,
        qualification: optionalString(body.qualification) ?? null,
        clinicName: optionalString(body.clinicName) ?? null,
        city: optionalString(body.city) ?? null,
        country: optionalString(body.country) ?? "Somaliland",
        consultationFee: parseNumber(body.consultationFee, "consultationFee") ?? null,
        currency: optionalString(body.currency) ?? "USD",
        bio: optionalString(body.bio) ?? null,
        verificationStatus: DoctorVerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        isActive: true,
        isAvailable: parseBool(body.isAvailable, true)!,
        videoConsultationEnabled: parseBool(
          body.videoConsultationEnabled,
          false
        )!,
        chatConsultationEnabled: parseBool(
          body.chatConsultationEnabled,
          false
        )!,
      },
      include: {
        user: { select: { userid: true, email: true, fullName: true, phone: true } },
      },
    });
    return doctor;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const healthId = await generateUniqueHealthId();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      phone: optionalString(body.phone) ?? null,
      role: "USER",
      healthId,
      emailVerified: true,
      medicalProfile: { create: {} },
      doctor: {
        create: {
          fullName,
          specialty,
          subSpecialty: optionalString(body.subSpecialty) ?? null,
          licenseNumber: optionalString(body.licenseNumber) ?? null,
          qualification: optionalString(body.qualification) ?? null,
          clinicName: optionalString(body.clinicName) ?? null,
          city: optionalString(body.city) ?? null,
          country: optionalString(body.country) ?? "Somaliland",
          consultationFee:
            parseNumber(body.consultationFee, "consultationFee") ?? null,
          currency: optionalString(body.currency) ?? "USD",
          bio: optionalString(body.bio) ?? null,
          verificationStatus: DoctorVerificationStatus.VERIFIED,
          verifiedAt: new Date(),
          isActive: true,
          isAvailable: parseBool(body.isAvailable, true)!,
          videoConsultationEnabled: parseBool(
            body.videoConsultationEnabled,
            false
          )!,
          chatConsultationEnabled: parseBool(
            body.chatConsultationEnabled,
            false
          )!,
        },
      },
    },
    include: {
      doctor: true,
    },
  });

  return {
    ...user.doctor!,
    user: {
      userid: user.userid,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
    },
  };
};
