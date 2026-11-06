import { BloodType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/ownership";
import { optionalString } from "../utils/validation";

export const getMedicalProfile = async (userId: string) => {
  // Single round-trip upsert avoids find+create races that hold extra pool slots.
  return prisma.medicalProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
};

export const upsertMedicalProfile = async (
  userId: string,
  body: Record<string, unknown>
) => {
  const data: Prisma.MedicalProfileUpdateInput = {};

  if (body.bloodType !== undefined) {
    const bt = String(body.bloodType) as BloodType;
    if (!Object.values(BloodType).includes(bt)) {
      throw new HttpError(400, "Invalid bloodType");
    }
    data.bloodType = bt;
  }
  if (body.smokingStatus !== undefined) {
    data.smokingStatus = optionalString(body.smokingStatus) ?? null;
  }
  if (body.alcoholUse !== undefined) {
    data.alcoholUse = optionalString(body.alcoholUse) ?? null;
  }
  if (body.exerciseFrequency !== undefined) {
    data.exerciseFrequency = optionalString(body.exerciseFrequency) ?? null;
  }
  if (body.dietType !== undefined) {
    data.dietType = optionalString(body.dietType) ?? null;
  }
  if (body.familyHistory !== undefined) {
    data.familyHistory = body.familyHistory as Prisma.InputJsonValue;
  }
  if (body.surgicalHistory !== undefined) {
    data.surgicalHistory = body.surgicalHistory as Prisma.InputJsonValue;
  }
  if (body.notes !== undefined) {
    data.notes = optionalString(body.notes) ?? null;
  }

  return prisma.medicalProfile.upsert({
    where: { userId },
    create: {
      userId,
      bloodType: (data.bloodType as BloodType) || BloodType.UNKNOWN,
      smokingStatus: (data.smokingStatus as string) ?? null,
      alcoholUse: (data.alcoholUse as string) ?? null,
      exerciseFrequency: (data.exerciseFrequency as string) ?? null,
      dietType: (data.dietType as string) ?? null,
      familyHistory: (data.familyHistory as Prisma.InputJsonValue) ?? undefined,
      surgicalHistory:
        (data.surgicalHistory as Prisma.InputJsonValue) ?? undefined,
      notes: (data.notes as string) ?? null,
    },
    update: data,
  });
};
